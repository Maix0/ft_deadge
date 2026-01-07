import type { ClientMessage, BlockRelation } from '../chat_types';
import { clientChat } from '../app';
import { FastifyInstance } from 'fastify';
import { getUserByName } from './getUserByName';
import type { User } from '@shared/database/mixin/user';
import { checkNamePair } from './checkNamePair';
import { whoBlockedMe } from './whoBlockedMe';

export async function broadcast(fastify: FastifyInstance, data: ClientMessage, sender?: string) {

	const Allusers: User[] = fastify.db.getAllUsers() ?? [];
	const UserID = getUserByName(Allusers, data.user)?.id ?? '';
	const list:BlockRelation[] = whoBlockedMe(fastify, UserID);
	const sockets = await fastify.io.fetchSockets();
	for (const socket of sockets) {
		const clientInfo = clientChat.get(socket.id);
		if (!clientInfo?.user) {
			continue;
		}
		let blockMsgFlag: boolean = false;
		const UserByID = getUserByName(Allusers, clientInfo.user)?.id ?? '';
		const user: User | null = getUserByName(Allusers, clientInfo.user);

		if (UserByID === '') return;
		blockMsgFlag = checkNamePair(list, data.SenderUserID, UserByID) || false;

		if (socket.id === sender) {
			continue;
		}

		if (!user?.id) return;
		const boolGuestMsg = fastify.db.getGuestMessage(user?.id);
		if (boolGuestMsg && user.guest) continue;
		if (!blockMsgFlag) {

 			socket.emit('MsgObjectServer', { message: data });
			if (data.SenderUserID) {
				fastify.log.info({ senderID: data.SenderUserID, msgBroadcast: data.text });
			}
		}
	}
}