import { FastifyInstance } from 'fastify';
import { clientChat, color } from './app';

/**
 * function broadcast a clickable link
 * @param fastify
 * @param gameLink
 */
export async function broadcastNextGame(fastify: FastifyInstance, gameLink?: Promise<string>) {
	const link = gameLink ? await gameLink : undefined;
	console.log(color.green, 'link===========> ', link);
	const sockets = await fastify.io.fetchSockets();
	// fastify.io.fetchSockets().then((sockets) => {
	for (const socket of sockets) {
		const clientInfo = clientChat.get(socket.id);
		if (!clientInfo?.user) {
			console.log(color.yellow, `DEBUG LOG: Skipping socket ${socket.id} (no user found)`);
			continue;
		}
		if (link) {
			socket.emit('nextGame', link);
		}
		// console.log(color.green, `'DEBUG LOG: Broadcast to:', ${data.command} message: ${data.text}`);
	}
};