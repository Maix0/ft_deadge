import type { ClientMessage } from '../chat_types';
import { clientChat } from '../app';
import { FastifyInstance } from 'fastify';
import { getUserByName } from './getUserByName';
import type { User } from '@shared/database/mixin/user';
import { checkNamePair } from './checkNamePair';
import { whoBlockedMe } from './whoBlockedMe';

type BlockRelation = {
	blocked: string;
	blocker: string;
};

/**
 * function looks up the socket of a user online in the chat and sends a message
 * it also sends a copy of the message to the sender
 * @param fastify
 * @param data
 * @param sender
*/

export async function sendPrivMessage(fastify: FastifyInstance, data: ClientMessage, sender?: string) {

	const sockets = await fastify.io.fetchSockets();
	const allUsers: User[] = fastify.db.getAllUsers() ?? [];
	const senderSocket = sockets.find(socket => socket.id === sender);

	for (const socket of sockets) {
		if (socket.id === sender) continue;
		const UserID = getUserByName(allUsers, data.user)?.id ?? '';
		const list:BlockRelation[] = whoBlockedMe(fastify, UserID);
		const clientInfo = clientChat.get(socket.id);
		if (!clientInfo) continue;

		let blockMsgFlag: boolean = false;
		const receiverUser: User | null = getUserByName(allUsers, clientInfo.user);
		if (!receiverUser) return;
	

		const user: string = clientChat.get(socket.id)?.user ?? '';
		const targetUser = `@${user}`;
		if (targetUser !== data.command || targetUser === '' || data.text === '') {
			continue;
		}

		blockMsgFlag = checkNamePair(list, UserID, receiverUser.id) || false;
		
		if (!blockMsgFlag) {
			socket.emit('MsgObjectServer', { message: data });
			fastify.log.info({ senderID: `${UserID}`, msgPriv: data.text, target: `${receiverUser.id}` });
			if (senderSocket) {
				senderSocket.emit('privMessageCopy', `${data.command}: ${data.text}🔒`);
			}
		}
	}
}
