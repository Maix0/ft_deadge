import OTP from "otp";
import cookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";
import fp from "fastify-plugin";
import { FastifyPluginAsync, preValidationAsyncHookHandler } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import { UserId } from "@shared/database/mixin/user";
import { useDatabase } from "@shared/database";
import { makeResponse } from "@shared/utils";

const kRouteAuthDone = Symbol("shared-route-auth-done");

type AuthedUser = {
	id: UserId;
	name: string;
};

declare module "fastify" {
	export interface FastifyInstance {
		signJwt: (kind: "auth" | "otp", who: string) => string;
		[s: symbol]: boolean;
	}
	export interface FastifyRequest {
		authUser?: AuthedUser;
	}
	export interface FastifyContextConfig {
		requireAuth?: boolean;
	}
}

export const Otp = OTP;
let jwtAdded = false;
export const jwtPlugin = fp<FastifyPluginAsync>(async (fastify, _opts) => {
	if (jwtAdded) jwtAdded = true;
	let env = process.env.JWT_SECRET;
	if (env === undefined || env === null) throw "JWT_SECRET is not defined";
	if (!fastify.hasDecorator("signJwt")) {
		void fastify.decorate("signJwt", (kind, who) =>
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
		Type.Const("otp", {
			description: "the token is only valid for otp call",
		}),
		Type.Const("auth", {
			description: "the token is valid for authentication",
		}),
	]),
	who: Type.String({ description: "the login of the user" }),
	createdAt: Type.Integer({
		description: "Unix timestamp of when the token as been created at",
	}),
});

export type JwtType = Static<typeof JwtType>;

let authAdded = false;
export const authPlugin = fp<FastifyPluginAsync>(async (fastify, _opts) => {
	if (authAdded) return void console.log("skipping");
	authAdded = true;
	await fastify.register(useDatabase as any, {});
	await fastify.register(jwtPlugin as any, {});
	await fastify.register(cookie);
	if (!fastify.hasRequestDecorator("authUser"))
		fastify.decorateRequest("authUser", undefined);
	fastify.addHook("onRoute", (routeOpts) => {
		if (
			routeOpts.config?.requireAuth &&
			!(routeOpts as any)[kRouteAuthDone]
		) {
			let f: preValidationAsyncHookHandler = async function(req, res) {
				try {
					if (req.cookies.token === undefined)
						return res
							.clearCookie("token")
							.send(
								JSON.stringify(makeResponse("notLoggedIn", "auth.noCookie")),
							);
					let tok = this.jwt.verify<JwtType>(req.cookies.token);
					if (tok.kind != "auth")
						return res
							.clearCookie("token")
							.send(
								JSON.stringify(makeResponse("notLoggedIn", "auth.invalidKind")),
							);
					let user = this.db.getUserFromName(tok.who);
					if (user === null)
						return res
							.clearCookie("token")
							.send(
								JSON.stringify(makeResponse("notLoggedIn", "auth.noUser")),
							);
					req.authUser = { id: user.id, name: tok.who };
				} catch {
					return res
						.clearCookie("token")
						.send(JSON.stringify(makeResponse("notLoggedIn", "auth.invalid")));
				}
			};
			if (!routeOpts.preValidation) {
				routeOpts.preValidation = [f];
			} else if (Array.isArray(routeOpts.preValidation)) {
				routeOpts.preValidation.push(f);
			} else {
				routeOpts.preValidation = [routeOpts.preValidation, f];
			}

			(routeOpts as any)[kRouteAuthDone] = true;
		}
	});
});
