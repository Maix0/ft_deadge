import type { ClientProfil } from './chat_types';
import { clientChat, color } from './app';
import { FastifyInstance } from 'fastify';

/**
 * function looks for the user online in the chat
 * and sends emit to invite - format HTML to make clickable
 * message appears in chat window text area
 * @param fastify
 * @param innerHtml
 * @param profil
 */

export function sendInvite(fastify: FastifyInstance, innerHtml: string, profil: ClientProfil) {
	fastify.io.fetchSockets().then((sockets) => {
		let targetSocket;
		for (const socket of sockets) {
			const clientInfo: string = clientChat.get(socket.id)?.user || '';
			if (clientInfo === profil.user) {
				console.log(color.yellow, 'DEBUG LOG: user online found', profil.user);
				targetSocket = socket || '';
				break;
			}
		}
		profil.innerHtml = innerHtml ?? '';
		if (targetSocket) {
			targetSocket.emit('inviteGame', profil);
		}
	});
}
