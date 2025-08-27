import OTP from "otp";
import fastifyJwt from "@fastify/jwt";
import fp from 'fastify-plugin'
import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { Static, Type } from "@sinclair/typebox"
import { useDatabase, user } from "@shared/database"
import cookie from "@fastify/cookie";


const kRouteAuthDone = Symbol('shared-route-auth-done');

declare module 'fastify' {
	export interface FastifyInstance {
		signJwt: (kind: "auth" | "otp", who: string) => string;
	}
	export interface FastifyRequest {
		authUser?: user.UserId;
	}
	export interface FastifyContextConfig {
		requireAuth?: boolean,
	}
}

export const Otp = OTP;
export const jwtPlugin = fp<FastifyPluginAsync>(async (fastify, _opts) => {
	let env = process.env.JWT_SECRET;
	if (env === undefined || env === null)
		throw "JWT_SECRET is not defined"
	void fastify.register(fastifyJwt, {
		secret: env,
		decode: { complete: false },
	});
	void fastify.decorate("signJwt", (kind, who) => fastify.jwt.sign({ kind, who, createdAt: Date.now() }))
});

export const JwtType = Type.Object({
	kind: Type.Union([
		Type.Const("otp", { description: "the token is only valid for otp call" }),
		Type.Const("auth", { description: "the token is valid for authentication" })
	]),
	who: Type.String({ description: "the login of the user" }),
	createdAt: Type.Integer({ description: "Unix timestamp of when the token as been created at" })
});

export type JwtType = Static<typeof JwtType>;


export const authPlugin = fp<FastifyPluginAsync>(async (fastify, _opts) => {
	await fastify.register(useDatabase as any, {});
	await fastify.register(jwtPlugin as any, {});
	await fastify.register(cookie);
	fastify.addHook('onRoute', (routeOpts) => {
		if (routeOpts.config?.requireAuth) {
			routeOpts.preValidation = [function(req, res) {
				if (req.cookies.token === undefined)
					return res.clearCookie("token").send({ kind: "notLoggedIn", msg_key: "" })
				let tok = this.jwt.verify<JwtType>(req.cookies.token);
				if (tok.kind != "auth")
					return res.clearCookie("token").send({ kind: "notLoggedIn", msg_key: "" })
				let user = this.db.getUserFromName(tok.who);
				if (user === null)
					return res.clearCookie("token").send({ kind: "notLoggedIn", msg_key: "" })
				req.authUser = user.id;
			}, ...(routeOpts.preValidation as any || []),];
		}
	})
})
