import type {
    FastifyInstance,
    FastifyPluginAsync,
    HookHandlerDoneFunction,
} from 'fastify';
import fp from 'fastify-plugin';
import { Server, type ServerOptions } from 'socket.io';

export type FastifySocketioOptions = Partial<ServerOptions> & {
    preClose?: (done: HookHandlerDoneFunction) => void;
};

const F: (f: FastifyInstance) => (Omit<FastifyInstance, 'io'> & { io: Server }) = f => (f as Omit<FastifyInstance, 'io'> & { io: Server });

const fastifySocketIO: FastifyPluginAsync<FastifySocketioOptions> = fp(
    async (fastify, opts: FastifySocketioOptions) => {
        function defaultPreClose(done: HookHandlerDoneFunction) {
            F(fastify).io.local.disconnectSockets(true);
            done();
        }
        fastify.decorate('io', new Server(fastify.server, opts));
        fastify.addHook('preClose', (done) => {
            if (opts.preClose) {
                return opts.preClose(done);
            }
            return defaultPreClose(done);
        });
        fastify.addHook('onClose', (instance: FastifyInstance, done) => {
            F(instance).io.close();
            done();
        });
    },
);


export default fastifySocketIO;