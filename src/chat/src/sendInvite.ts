import type { ClientMessage, ClientProfil } from './chat_types';
import { clientChat, color } from './app';
import { FastifyInstance } from 'fastify';
import { sendPrivMessage } from './sendPrivMessage';

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
			console.log(color.yellow, 'DEBUG LOG: sendInvite Function');
			const clientInfo: string = clientChat.get(socket.id)?.user || '';
			console.log(color.green, 'AskingName=', profil.SenderName);
			targetSocket = socket || null;
			if (!targetSocket) continue;
			if (clientInfo === profil.user) {
				profil.innerHtml = innerHtml ?? '';
				if (targetSocket.id) {
					
					const data: ClientMessage = {
						command: `@${clientInfo}`,
						destination: 'inviteMsg',
						type: "chat",
						user: profil.SenderName,
						token: '',
						text: ' needs this to work',
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
					
					console.log(color.yellow, 'DEBUG LOG: sendInvite Function -> sendPrivMessage :');
					sendPrivMessage(fastify, data, '');
				

					// targetSocket.emit('MsgObjectServer', { message: data });


					// targetSocket.emit('inviteGame', profil);

				}
				return;
			}
		}
	});
}
