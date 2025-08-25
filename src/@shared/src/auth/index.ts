import fastifyJwt from "@fastify/jwt";
import { FastifyPluginAsync } from "fastify";
import fp from 'fastify-plugin'
import { user } from "@shared/database"

export const jwtPlugin = fp<FastifyPluginAsync>(async (fastify, _opts) => {
	let env = process.env.JWT_SECRET;
	if (env === undefined || env === null)
		throw "JWT_SECRET is not defined"
	void fastify.register(fastifyJwt, {
		secret: env,
		decode: { complete: false },
	});
});

export type JwtClaims = {
	id: user.UserId,
};

export * as _inner from "./_inner.js";

export const otpPlugin = fp<FastifyPluginAsync>(async (fastify, _opts) => {
	fastify.decorate('otp', {}, ["db"]);
})
