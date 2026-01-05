import type { ClientMessage, ClientProfil } from '../chat_types';
import { clientChat } from '../app';
import { FastifyInstance } from 'fastify';
import { sendPrivMessage } from './sendPrivMessage';

/**
 * TODO
 * function needed to transfer the game number
*/

function getGameNumber():string {
	const gameNumber = '123456GameNum';
	return gameNumber;
}

/**
 * function looks for the user online in the chat
 * and sends emit to invite - format HTML to make clickable
 * message appears in chat window text area
 * @param fastify
 * @param innerHtml
 * @param profil
*/

export async function sendInvite(fastify: FastifyInstance, innerHtml: string, profil: ClientProfil) {
	const sockets = await fastify.io.fetchSockets();
	let targetSocket;
	for (const socket of sockets) {
		const clientInfo: string = clientChat.get(socket.id)?.user || '';
		targetSocket = socket || null;
		if (!targetSocket) continue;
		if (clientInfo === profil.user) {
			profil.innerHtml = innerHtml ?? '';
			if (targetSocket.id) {
				const data: ClientMessage = {
					command: `@${clientInfo}`,
					destination: 'inviteMsg',
					type: 'chat',
					user: profil.SenderName,
					token: '',
					text: getGameNumber(),
					timestamp: Date.now(),
					SenderWindowID: socket.id,
					userID: '',
					frontendUserName: '',
					frontendUser: '',
					SenderUserName: profil.SenderName,
					SenderUserID: '',
					Sendertext: '',
					innerHtml: innerHtml,
				};
				sendPrivMessage(fastify, data, '');
			}
			return;
		}
	}
}