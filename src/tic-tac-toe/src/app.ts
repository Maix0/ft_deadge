import { TTC } from './game';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fastifyFormBody from '@fastify/formbody';
import fastifyMultipart from '@fastify/multipart';
import * as db from '@shared/database';
import * as auth from '@shared/auth';
import * as swagger from '@shared/swagger';
import * as utils from '@shared/utils';
import { Server } from 'socket.io';
// import type { TicTacToeImpl } from '@shared/database/mixin/tictactoe';

declare const __SERVICE_NAME: string;

// @ts-expect-error: import.meta.glob is a vite thing. Typescript doesn't know this...
const plugins = import.meta.glob('./plugins/**/*.ts', { eager: true });
// @ts-expect-error: import.meta.glob is a vite thing. Typescript doesn't know this...
const routes = import.meta.glob('./routes/**/*.ts', { eager: true });

const app: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	void opts;

	await fastify.register(utils.useMonitoring);
	await fastify.register(utils.useMakeResponse);
	await fastify.register(swagger.useSwagger, { service: __SERVICE_NAME });
	await fastify.register(db.useDatabase as FastifyPluginAsync, {});
	await fastify.register(auth.jwtPlugin as FastifyPluginAsync, {});
	await fastify.register(auth.authPlugin as FastifyPluginAsync, {});

	// Place here your custom code!
	for (const plugin of Object.values(plugins)) {
		void fastify.register(plugin as FastifyPluginAsync, {});
	}
	for (const route of Object.values(routes)) {
		void fastify.register(route as FastifyPluginAsync, {});
	}

	void fastify.register(fastifyFormBody, {});
	void fastify.register(fastifyMultipart, {});

	const game = new TTC();

	fastify.ready((err) => {
		if (err) throw err;
		onReady(fastify, game);
	});
};
export default app;

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
	interface FastifyInstance {
		io: Server<{
			hello: (message: string) => string;
			// idk you put something
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			gameState: any;
			makeMove: (idx: number) => void;
			resetGame: () => void;
			error: string,
		}>;
	}
}

async function onReady(fastify: FastifyInstance, game: TTC) {
	fastify.io.on('connection', (socket) => {
		fastify.log.info(`Client connected: ${socket.id}`);

		socket.emit('gameState', {
			board: game.board,
			turn: game.currentPlayer,
			gameOver: game.isGameOver,
		});

		socket.on('makeMove', (idx: number) => {
			const result = game.makeMove(idx);

			if (result === 'invalidMove') {
				socket.emit('error', 'Invalid Move');
			}
			else {
				fastify.io.emit('gameState', {
					board: game.board,
					turn: game.currentPlayer,
					lastResult: result,
				});
				// setGameOutcome();
			}
		});

		socket.on('resetGame', () => {
			game.reset();
			fastify.io.emit('gameState', {
				board: game.board,
				turn: game.currentPlayer,
				reset: true,
			});
		});
	});
}