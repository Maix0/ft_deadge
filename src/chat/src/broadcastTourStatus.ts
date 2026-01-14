import { FastifyInstance } from 'fastify';
import { clientChat } from './app';

/**
 * function broadcast a clickable link
 * @param fastify
 * @param gameLink
 */
export async function broadcastTourStatus(fastify: FastifyInstance, gameLink?: string) {
	const link = gameLink;
	const sockets = await fastify.io.fetchSockets();
	for (const socket of sockets) {
		const clientInfo = clientChat.get(socket.id);
		if (!clientInfo?.user) {
			continue;
		}
		if (link) {
			socket.emit('tourStatus', link);
		}
	}
};
