import type { ClientProfil } from '../chat_types';
import { clientChat } from '../app';
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

export async function sendInvite(fastify: FastifyInstance, innerHtml: string, profil: ClientProfil, senderSocketId: string) {

	const clientName: string = clientChat.get(senderSocketId)?.user || '';

	sendPrivMessage(fastify, {
		command: `@${profil.user}`,
		destination: 'inviteMsg',
		type: 'chat',
		user: clientName,
		userID: profil.userID,
		SenderWindowID: senderSocketId,
	   	SenderUserID: profil.SenderID,
		SenderUserName: profil.SenderName,
		innerHtml: innerHtml,
	}, senderSocketId);

}