/* eslint-disable @typescript-eslint/no-explicit-any */
import { JwtType } from '@shared/auth';
import { UserId } from '@shared/database/mixin/user';
import { isNullish } from '@shared/utils';
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

function authenticateToken(
	fastify: FastifyInstance,
	token: string,
): { id: UserId; name: string; guest: boolean } {
	const tok = fastify.jwt.verify<JwtType>(token);
	if (tok.kind != 'auth') {
		throw new Error('Token isn\'t correct type');
	}
	const user = fastify.db.getUser(tok.who);
	if (isNullish(user)) {
		throw new Error('User not found');
	}
	return { id: user.id, name: user.name, guest: user.guest };
}

const fastifySocketIO: FastifyPluginAsync = fp(async (fastify) => {
	function defaultPreClose(done: HookHandlerDoneFunction) {
		F(fastify).io.local.disconnectSockets(true);
		done();
	}
	fastify.decorate(
		'io',
		new Server(fastify.server, { path: '/api/pong/socket.io' }),
	);
	F(fastify).io.use((socket, next) => {
		const cookieHeader = socket.request.headers.cookie;

		if (!cookieHeader) {
			throw new Error('Missing token cookie');
		}

		const cookies = Object.fromEntries(
			cookieHeader.split(';').map((c) => {
				const [k, v] = c.trim().split('=');
				return [k, v];
			}),
		);

		if (!cookies.token) {
			throw new Error('Missing token cookie');
		}
		try {
			socket.authUser = authenticateToken(fastify, cookies.token);
			next();
		}
		catch (e: any) {
			next({
				name: 'Unauthorized',
				message: e.message,
				data: { status: 401 },
			});
		}
	});

	fastify.addHook('preClose', defaultPreClose);
	fastify.addHook('onClose', (instance: FastifyInstance, done) => {
		F(instance).io.close();
		done();
	});
});

export default fastifySocketIO;
