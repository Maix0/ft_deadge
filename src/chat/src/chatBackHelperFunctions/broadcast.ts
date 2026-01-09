import type { ClientMessage, BlockRelation } from '../chat_types';
import { clientChat } from '../app';
import { FastifyInstance } from 'fastify';
import { getUserByName } from './getUserByName';
import type { User } from '@shared/database/mixin/user';
import { checkNamePair } from './checkNamePair';
import { whoBlockedMe } from './whoBlockedMe';

export async function broadcast(fastify: FastifyInstance, data: ClientMessage, sender?: string) {

	const Allusers: User[] = fastify.db.getAllUsers() ?? [];
	if (!data.user) return;
	const senderUser = getUserByName(Allusers, data.user)
	if (!senderUser) return;
	const list:BlockRelation[] = whoBlockedMe(fastify, senderUser.id);
	const sockets = await fastify.io.fetchSockets();
	for (const socket of sockets) {
		if (socket.id === sender) continue;

		const socketClientInfo = clientChat.get(socket.id);
		if (!socketClientInfo?.user) continue;

		const receiverUser: User | null = getUserByName(Allusers, socketClientInfo.user);
		if (!receiverUser) return;

		let blockMsgFlag: boolean = false;
		blockMsgFlag = checkNamePair(list, senderUser.id, receiverUser.id) || false;

		const getReceiverGuestConfig = fastify.db.getGuestMessage(receiverUser?.id);
		if (!getReceiverGuestConfig && senderUser?.guest && data.destination !== 'system-info') continue;
		if (!blockMsgFlag) {

 			socket.emit('MsgObjectServer', { message: data });
			if (data.SenderUserID) {
				fastify.log.info({ senderID: data.SenderUserID, msgBroadcast: data.text });
			}
		}
	}
}