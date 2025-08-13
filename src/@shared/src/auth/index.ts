import fastifyJwt from "@fastify/jwt";
import { FastifyPluginAsync } from "fastify";
import fp from 'fastify-plugin'

export const jwtPlugin = fp<FastifyPluginAsync>(async (fastify, _opts) => {
	let env = process.env.JWT_SECRET;
	if (env === undefined || env === null)
		throw "JWT_SECRET is not defined"
	void fastify.register(fastifyJwt, { secret: env });
});

