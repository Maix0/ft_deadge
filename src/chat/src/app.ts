import { FastifyPluginAsync } from 'fastify';
import fastifyFormBody from '@fastify/formbody';
import fastifyMultipart from '@fastify/multipart';
import * as db from '@shared/database';
import * as auth from '@shared/auth';
import * as swagger from '@shared/swagger';
import * as utils from '@shared/utils';
import { Server } from 'socket.io';
import useSocketIo from 'fastify-socket.io';

declare const __SERVICE_NAME: string;

// @ts-expect-error: import.meta.glob is a vite thing. Typescript doesn't know this...
const plugins = import.meta.glob('./plugins/**/*.ts', { eager: true });
// @ts-expect-error: import.meta.glob is a vite thing. Typescript doesn't know this...
const routes = import.meta.glob('./routes/**/*.ts', { eager: true });

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
	interface FastifyInstance {
		io: Server<{
			hello: (message: string) => string,
			coucou: (data: { message: string }) => void,
			message: (msg: string) => void,
		}>
	}
}

const app: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	void opts;
	await fastify.register(utils.useMakeResponse);
	await fastify.register(swagger.useSwagger, { service: __SERVICE_NAME });
	await fastify.register(db.useDatabase as FastifyPluginAsync, {});
	await fastify.register(auth.jwtPlugin as FastifyPluginAsync, {});
	await fastify.register(auth.authPlugin as FastifyPluginAsync, {});
	await fastify.register(useSocketIo, {
		path: '/api/chat/socket.io',
	});

	// Place here your custom code!
	for (const plugin of Object.values(plugins)) {
		void fastify.register(plugin as FastifyPluginAsync, {});
	}
	for (const route of Object.values(routes)) {
		void fastify.register(route as FastifyPluginAsync, {});
	}

	void fastify.register(fastifyFormBody, {});
	void fastify.register(fastifyMultipart, {});
	fastify.get('/monitoring', () => 'Ok');

	fastify.ready((err) => {
		if (err) throw err;

		fastify.io.on('connection', (socket) => {
			console.info('Socket connected!', socket.id);
			socket.on('hello', (value) => {
				console.log(`GOT HELLO ${value}`);
				return 'hi';
			});
			socket.on('message', (value) => console.log(`GOT MESSAGE ${value}`));
			socket.on('coucou', (value) => console.log(`GOT COUCOU ${value.message}`));
		},
		);

	});
};

export default app;
export { app };
