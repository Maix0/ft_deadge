import * as path from 'node:path'
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'
import { FastifyPluginAsync } from 'fastify'
import { fileURLToPath } from 'node:url'
import fastifyFormBody from '@fastify/formbody'
import fastifyMultipart from '@fastify/multipart'
import { mkdir } from 'node:fs/promises'
import fp from 'fastify-plugin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type AppOptions = {
	// Place your custom options for app below here.
} & Partial<AutoloadPluginOptions>

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {
}

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
	export interface FastifyInstance {
		image_store: string;
	}
}

const app: FastifyPluginAsync<AppOptions> = async (
	fastify,
	opts
): Promise<void> => {
	// Place here your custom code!

	void fastify.register(fastifyFormBody, {})
	void fastify.register(fastifyMultipart, {})

	// The use of fastify-plugin is required to be able
	// to export the decorators to the outer scope
	void fastify.register(fp(async (fastify) => {
		const image_store = process.env.USER_ICONS_STORE ?? "/tmp/icons";
		fastify.decorate('image_store', image_store)
		await mkdir(fastify.image_store, { recursive: true })
	}))



	// Do not touch the following lines

	// This loads all plugins defined in plugins
	// those should be support plugins that are reused
	// through your application
	// eslint-disable-next-line no-void
	void fastify.register(AutoLoad, {
		dir: path.join(__dirname, 'plugins'),
		options: opts,
		forceESM: true
	})

	// This loads all plugins defined in routes
	// define your routes in one of these
	// eslint-disable-next-line no-void
	void fastify.register(AutoLoad, {
		dir: path.join(__dirname, 'routes'),
		options: opts,
		forceESM: true
	})

}

export default app
export { app, options }
