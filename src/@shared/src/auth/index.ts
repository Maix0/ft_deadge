import OTP from 'otp';
import cookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import fp from 'fastify-plugin';
import { FastifyPluginAsync, preValidationAsyncHookHandler } from 'fastify';
import { Static, TSchema, Type } from 'typebox';
import * as Typebox from 'typebox';
import { UserId } from '@shared/database/mixin/user';
import { useDatabase } from '@shared/database';
import { isNullish, typeResponse } from '@shared/utils';

const kRouteAuthDone = Symbol('shared-route-auth-done');

type AuthedUser = {
	id: UserId;
	name: string;
	guest: boolean;
};

declare module 'fastify' {
	export interface FastifyInstance {
		signJwt: (kind: 'auth' | 'otp', who: string) => string;
		[s: symbol]: boolean;
	}
	export interface FastifyRequest {
		authUser?: AuthedUser;
	}
	export interface FastifyContextConfig {
		requireAuth?: boolean;
	}
	export interface RouteOptions {
		[kRouteAuthDone]: boolean;
	}
}

export const Otp = OTP;
let jwtAdded = false;
export const jwtPlugin = fp<FastifyPluginAsync>(async (fastify, _opts) => {
	void _opts;

	if (jwtAdded) return;
	jwtAdded = true;
	const env = process.env.JWT_SECRET;
	if (isNullish(env)) throw 'JWT_SECRET is not defined';
	if (!fastify.hasDecorator('signJwt')) {
		void fastify.decorate('signJwt', (kind, who) =>
			fastify.jwt.sign({ kind, who, createdAt: Date.now() }),
		);
		void fastify.register(fastifyJwt, {
			secret: env,
			decode: { complete: false },
		});
	}
});

export const JwtType = Type.Object({
	kind: Type.Union([
		Type.Enum(['otp', 'auth'], {
			description: 'otp: token represent an inflight login request\nauth: represent a logged in user',
		}),
	]),
	who: Type.String({ description: 'the login of the user' }),
	createdAt: Type.Integer({
		description: 'Unix timestamp of when the token as been created at',
	}),
});

export type JwtType = Static<typeof JwtType>;

export const authSchema = typeResponse('notLoggedIn', ['auth.noCookie', 'auth.invalidKind', 'auth.noUser', 'auth.invalid']);

let authAdded = false;
export const authPlugin = fp<{ onlySchema?: boolean }>(async (fastify, { onlySchema }) => {

	if (authAdded) return;
	const bOnlySchema = onlySchema ?? false;
	authAdded = true;
	if (!bOnlySchema) {
		await fastify.register(useDatabase as FastifyPluginAsync, {});
		await fastify.register(jwtPlugin as FastifyPluginAsync, {});
		await fastify.register(cookie);
		if (!fastify.hasRequestDecorator('authUser')) { fastify.decorateRequest('authUser', undefined); }
	}
	fastify.addHook('onRoute', (routeOpts) => {
		if (
			routeOpts.config?.requireAuth &&
			!routeOpts[kRouteAuthDone]
		) {
			routeOpts.schema = routeOpts.schema ?? {};
			routeOpts.schema.response = routeOpts.schema.response ?? {};
			let schema: TSchema = authSchema;
			if ('401' in (routeOpts.schema.response as { [k: string]: TSchema })) {
				const schema_orig = (routeOpts.schema.response as { [k: string]: TSchema })['401'];
				if (Type.IsUnion(schema_orig)) {
					schema = Typebox.Union([...((schema_orig as Typebox.TUnion).anyOf), authSchema]);
				}
				else if (Type.IsObject(schema_orig)) {
					schema = Typebox.Union([schema_orig, authSchema]);
				}
			}
			(routeOpts.schema.response as { [k: string]: TSchema })['401'] = schema;
			if (!bOnlySchema) {
				const f: preValidationAsyncHookHandler = async function(req, res) {
					try {
						if (isNullish(req.cookies.token)) {
							return res
								.clearCookie('token', { path: '/' })
								.makeResponse(401, 'notLoggedIn', 'auth.noCookie');
						}
						const tok = this.jwt.verify<JwtType>(req.cookies.token);
						if (tok.kind != 'auth') {
							return res
								.clearCookie('token', { path: '/' })
								.makeResponse(401, 'notLoggedIn', 'auth.invalidKind');
						}
						const user = this.db.getUser(tok.who);
						if (isNullish(user)) {
							return res
								.clearCookie('token', { path: '/' })
								.makeResponse(401, 'notLoggedIn', 'auth.noUser');
						}
						req.authUser = { id: user.id, name: user.name, guest: user.guest };
					}
					catch {
						return res
							.clearCookie('token', { path: '/' })
							.makeResponse(401, 'notLoggedIn', 'auth.invalid');
					}
				};
				if (!routeOpts.preValidation) {
					routeOpts.preValidation = [f];
				}
				else if (Array.isArray(routeOpts.preValidation)) {
					routeOpts.preValidation.push(f);
				}
				else {
					routeOpts.preValidation = [routeOpts.preValidation, f];
				}
			}

			routeOpts[kRouteAuthDone] = true;
		}
	});
});
