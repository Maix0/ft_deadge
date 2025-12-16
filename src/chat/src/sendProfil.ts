import { FastifyInstance } from 'fastify';
import type { ClientProfil } from './chat_types';

/**
 * function takes a user profil and sends it to the asker by window id
 * @param fastify
 * @param profil
 * @param SenderWindowID
 */

export function sendProfil(fastify: FastifyInstance, profil: ClientProfil, SenderWindowID?: string) {
	fastify.io.fetchSockets().then((sockets) => {
		const senderSocket = sockets.find(socket => socket.id === SenderWindowID);
		if (senderSocket) {
			// console.log(color.yellow, 'DEBUG LOG: profil.info:', profil.user);
			senderSocket.emit('profilMessage', profil);
		}
	});
}