import { FastifyInstance } from 'fastify';
import type { ClientProfil } from '../chat_types';

/**
 * function takes a user profil and sends it to the asker by window id
 * @param fastify
 * @param profil
 * @param SenderWindowID
*/

export async function sendProfil(fastify: FastifyInstance, profil: ClientProfil, SenderWindowID?: string) {
	const sockets = await fastify.io.fetchSockets();
	const senderSocket = sockets.find(socket => socket.id === SenderWindowID);
	if (senderSocket) {
		senderSocket.emit('profilMessage', profil);
	}
}