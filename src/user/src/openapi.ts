import f, { FastifyPluginAsync } from 'fastify';
import * as swagger from '@shared/swagger';
import * as auth from '@shared/auth';

declare const __SERVICE_NAME: string;

// @ts-expect-error: import.meta.glob is a vite thing. Typescript doesn't know this...
const routes = import.meta.glob('./routes/**/*.ts', { eager: true });

async function start() {
	const fastify = f({ logger: false });
	await fastify.register(auth.authPlugin, { onlySchema: true });
	await fastify.register(swagger.useSwagger, { service: __SERVICE_NAME });

	for (const route of Object.values(routes)) {
		await fastify.register(route as FastifyPluginAsync, {});
	}
	await fastify.ready();
	console.log(JSON.stringify(fastify.swagger(), undefined, 4));
}
start();
