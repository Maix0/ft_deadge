import { FastifyPluginAsync } from 'fastify'
import fastifyFormBody from '@fastify/formbody'
import fastifyMultipart from '@fastify/multipart'
import { mkdir } from 'node:fs/promises'
import fp from 'fastify-plugin'

const plugins = import.meta.glob('./plugins/**/*.ts', { eager: true });
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
		void fastify.register(plugin, {});
	}
	for (const route of Object.values(routes)) {
		void fastify.register(route, {});
	}

	//void fastify.register(MyPlugin, {})
	void fastify.register(fastifyFormBody, {})
	void fastify.register(fastifyMultipart, {})

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
