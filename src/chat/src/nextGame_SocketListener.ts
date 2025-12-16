import type { FastifyInstance } from 'fastify';
import { broadcastNextGame } from './broadcastNextGame';
import { Socket } from 'socket.io';
import { createNextGame } from './createNextGame';
import { sendGameLinkToChatService } from './sendGameLinkToChatService';

/**
 * function listens to the socket for a nextGame emit
 * once triggered it broadcasts the pop up
 * TODO plug this into backend of the game Chat
 * @param fastify
 * @param socket
 */
export function nextGame_SocketListener(fastify: FastifyInstance, socket: Socket) {
	socket.on('nextGame', () => {
		const link = createNextGame();
		const game: Promise<string> = sendGameLinkToChatService(link);
		broadcastNextGame(fastify, game);
	});
}