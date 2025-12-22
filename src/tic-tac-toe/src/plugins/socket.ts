import type {
	FastifyInstance,
	FastifyPluginAsync,
	HookHandlerDoneFunction,
} from 'fastify';
import fp from 'fastify-plugin';
import { Server } from 'socket.io';

const F: (
	f: FastifyInstance,
) => Omit<FastifyInstance, 'io'> & { io: Server } = (f) =>
		f as Omit<FastifyInstance, 'io'> & { io: Server };

const fastifySocketIO: FastifyPluginAsync = fp(async (fastify) => {
	function defaultPreClose(done: HookHandlerDoneFunction) {
		F(fastify).io.local.disconnectSockets(true);
		done();
	}
	fastify.decorate(
		'io',
		new Server(fastify.server, { path: '/api/ttt/socket.io' }),
	);
	fastify.addHook('preClose', defaultPreClose);
	fastify.addHook('onClose', (instance: FastifyInstance, done) => {
		F(instance).io.close();
		done();
	});
});

export default fastifySocketIO;

