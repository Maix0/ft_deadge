import type { ClientProfil } from './chat_types';
import { clientChat } from './app';
import { FastifyInstance } from 'fastify';

/**
 * function looks for the online (socket) for user to block, when found send ordre to block or unblock user
 * @param fastify
 * @param blockedMessage
 * @param profil
 */

export async function sendBlocked(fastify: FastifyInstance, blockedMessage: string, profil: ClientProfil) {
	const sockets = await fastify.io.fetchSockets();
	let targetSocket;
	for (const socket of sockets) {
		const clientInfo: string = clientChat.get(socket.id)?.user || '';
		if (clientInfo === profil.user) {
			targetSocket = socket ?? null;
			break;
		}
	}
	profil.text = blockedMessage ?? '';
	if (targetSocket) {
		targetSocket.emit('blockUser', profil);
	}
}
