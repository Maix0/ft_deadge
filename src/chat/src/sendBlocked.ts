import type { ClientProfil } from './chat_types';
import { clientChat, color } from './app';
import { FastifyInstance } from 'fastify';

/**
 * function looks for the online (socket) for user to block, when found send ordre to block or unblock user
 * @param fastify
 * @param blockedMessage
 * @param profil
 */

export function sendBlocked(fastify: FastifyInstance, blockedMessage: string, profil: ClientProfil) {
	fastify.io.fetchSockets().then((sockets) => {
		let targetSocket;
		for (const socket of sockets) {
			const clientInfo: string = clientChat.get(socket.id)?.user || '';
			if (clientInfo === profil.user) {
				console.log(color.yellow, 'DEBUG LOG: User found online to block:', profil.user);
				targetSocket = socket || '';
				break;
			}
		}
		profil.text = blockedMessage ?? '';
		// console.log(color.red, 'DEBUG LOG:',profil.Sendertext);
		if (targetSocket) {
			targetSocket.emit('blockUser', profil);
		}
	});
}
