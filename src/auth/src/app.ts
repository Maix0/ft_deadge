import { FastifyPluginAsync } from 'fastify'
import fastifyFormBody from '@fastify/formbody'
import fastifyMultipart from '@fastify/multipart'
import { mkdir } from 'node:fs/promises'
import fp from 'fastify-plugin'
import * as db from '@shared/database'
import * as auth from '@shared/auth'

// @ts-ignore: import.meta.glob is a vite thing. Typescript doesn't know this...
const plugins = import.meta.glob('./plugins/**/*.ts', { eager: true });
// @ts-ignore: import.meta.glob is a vite thing. Typescript doesn't know this...
const routes = import.meta.glob('./routes/**/*.ts', { eager: true });


// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
	export interface FastifyInstance {
		image_store: string;
	}
}

const app: FastifyPluginAsync = async (
	fastify,
	opts
): Promise<void> => {
	await fastify.register(db.useDatabase as any, {})
	await fastify.register(auth.jwtPlugin as any, {})
	await fastify.register(auth.authPlugin as any, {})
	
	// Place here your custom code!
	for (const plugin of Object.values(plugins)) {
		void fastify.register(plugin as any, {});
	}
	for (const route of Object.values(routes)) {
		void fastify.register(route as any, {});
	}

	void fastify.register(fastifyFormBody, {})
	void fastify.register(fastifyMultipart, {})
}

export default app
export { app }
