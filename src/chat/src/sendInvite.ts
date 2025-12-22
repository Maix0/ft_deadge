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
			targetSocket = socket || null;
			if (!targetSocket) continue;
			console.log(color.yellow, 'DEBUG LOG: user online found', profil.user, 'socket', targetSocket.id);
			if (clientInfo === profil.user) {
				profil.innerHtml = innerHtml ?? '';
				if (targetSocket.id) {
					targetSocket.emit('inviteGame', profil);
				}
				return;
			}
		}
	});
}
