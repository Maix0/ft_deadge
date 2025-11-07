import { FastifyPluginAsync } from 'fastify';
import fastifyFormBody from '@fastify/formbody';
import fastifyMultipart from '@fastify/multipart';
import { mkdir } from 'node:fs/promises';
import fp from 'fastify-plugin';
import * as db from '@shared/database';
import { authPlugin, jwtPlugin } from '@shared/auth';

// @ts-expect-error: import.meta.glob is a vite thing. Typescript doesn't know this...
const plugins = import.meta.glob('./plugins/**/*.ts', { eager: true });
// @ts-expect-error: import.meta.glob is a vite thing. Typescript doesn't know this...
const routes = import.meta.glob('./routes/**/*.ts', { eager: true });


// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
	export interface FastifyInstance {
		image_store: string;
	}
}

const app: FastifyPluginAsync = async (
	fastify,
	_opts,
): Promise<void> => {
	void _opts;
	// Place here your custom code!
	for (const plugin of Object.values(plugins)) {
		void fastify.register(plugin as FastifyPluginAsync, {});
	}
	for (const route of Object.values(routes)) {
		void fastify.register(route as FastifyPluginAsync, {});
	}

	await fastify.register(db.useDatabase as FastifyPluginAsync, {});
	await fastify.register(authPlugin as FastifyPluginAsync, {});
	await fastify.register(jwtPlugin as FastifyPluginAsync, {});

	void fastify.register(fastifyFormBody, {});
	void fastify.register(fastifyMultipart, {});

	// The use of fastify-plugin is required to be able
	// to export the decorators to the outer scope
	void fastify.register(fp(async (fastify2) => {
		const image_store = process.env.USER_ICONS_STORE ?? '/tmp/icons';
		fastify2.decorate('image_store', image_store);
		await mkdir(fastify2.image_store, { recursive: true });
	}));
	fastify.get('/monitoring', () => 'Ok');
};

export default app;
export { app };
