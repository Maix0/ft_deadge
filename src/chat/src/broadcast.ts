import type { ClientMessage } from './chat_types';
import { clientChat, color } from './app';
import { FastifyInstance } from 'fastify';

export function broadcast(fastify: FastifyInstance, data: ClientMessage, sender?: string) {
	fastify.io.fetchSockets().then((sockets) => {
		for (const socket of sockets) {
			// Skip sender's own socket
			if (socket.id === sender) continue;
			// Get client name from map
			const clientInfo = clientChat.get(socket.id);
			if (!clientInfo?.user) {
				console.log(color.yellow, `Skipping socket ${socket.id} (no user found)`);
				continue;
			}
			// Emit structured JSON object
			socket.emit('MsgObjectServer', { message: data });
			// Debug logs
			// console.log(color.green, `'DEBUG LOG: Broadcast to:', ${data.command} message: ${data.text}`);
		}
	});
}