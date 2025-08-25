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
	// Place here your custom code!
	for (const plugin of Object.values(plugins)) {
		void fastify.register(plugin as any, {});
	}
	for (const route of Object.values(routes)) {
		void fastify.register(route as any, {});
	}

	await fastify.register(db.useDatabase as any, {})
	await fastify.register(auth.jwtPlugin as any, {})
	void fastify.register(fastifyFormBody, {})
	void fastify.register(fastifyMultipart, {})
	console.log(fastify.db.getUser(0 as any));

	// The use of fastify-plugin is required to be able
	// to export the decorators to the outer scope
	void fastify.register(fp(async (fastify) => {
		const image_store = process.env.USER_ICONS_STORE ?? "/tmp/icons";
		fastify.decorate('image_store', image_store)
		await mkdir(fastify.image_store, { recursive: true })
	}))

}

export default app
export { app }
