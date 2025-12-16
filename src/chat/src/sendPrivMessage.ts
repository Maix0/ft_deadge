import type { ClientMessage } from './chat_types';
import { clientChat, color } from './app';
import { FastifyInstance } from 'fastify';

/**
 * function looks up the socket of a user online in the chat and sends a message
 * it also sends a copy of the message to the sender
 * @param fastify
 * @param data
 * @param sender
 */

export function sendPrivMessage(fastify: FastifyInstance, data: ClientMessage, sender?: string) {
	fastify.io.fetchSockets().then((sockets) => {
		const senderSocket = sockets.find(socket => socket.id === sender);
		for (const socket of sockets) {
			if (socket.id === sender) continue;
			const clientInfo = clientChat.get(socket.id);
			if (!clientInfo?.user) {
				console.log(color.yellow, `DEBUG LOG: Skipping socket ${socket.id} (no user found)`);
				continue;
			}
			const user: string = clientChat.get(socket.id)?.user ?? '';
			const atUser = `@${user}`;
			if (atUser !== data.command || atUser === '') {
				console.log(color.yellow, `DEBUG LOG: User: '${atUser}' command NOT FOUND: '${data.command[0]}' `);
				continue;
			}
			if (data.text !== '') {
				socket.emit('MsgObjectServer', { message: data });
				console.log(color.yellow, `DEBUG LOG: User: '${atUser}' command FOUND: '${data.command}' `);
				if (senderSocket) {
					senderSocket.emit('privMessageCopy', `${data.command}: ${data.text}🔒`);
				}
			}
			console.log(color.green, `DEBUG LOG: 'Priv to:', ${data.command} message: ${data.text}`);
		}
	});
}
