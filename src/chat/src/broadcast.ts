import type { ClientMessage, BlockRelation} from './chat_types';
import { clientChat } from './app';
import { FastifyInstance } from 'fastify';
import { getUserByName } from './getUserByName';
import type { User } from '@shared/database/mixin/user';
import { color } from './app';
import { checkNamePair } from './checkNamePair';
import { whoBlockedMe } from './whoBlockedMe';

export async function broadcast(fastify: FastifyInstance, data: ClientMessage, sender?: string) {

	const AllusersBlocked: User[] = fastify.db.getAllUsers() ?? [];
	const UserID = getUserByName(AllusersBlocked, data.user)?.id ?? '';
	const list:BlockRelation[] = whoBlockedMe(fastify, UserID);
	const sockets = await fastify.io.fetchSockets();
	for (const socket of sockets) {
		const clientInfo = clientChat.get(socket.id);
		if (!clientInfo?.user) {
			console.log(color.red, `Skipping socket ${socket.id} (no user found)`);
			continue;
		}
		let blockMsgFlag: boolean = false;
		const UserByID = getUserByName(AllusersBlocked, clientInfo.user)?.id ?? '';
		if (UserByID === '') return;
		blockMsgFlag = checkNamePair(list, data.SenderUserID, UserByID) || false;

		if (socket.id === sender) {
			console.log(color.red, 'sKip Sender ', socket.id);
			continue;
		}
		console.log(`BROADCAST blockFlag=${blockMsgFlag} : Target ${clientInfo.user}`);
		if (!blockMsgFlag) {
			console.log(color.blue, 'Emit message: ', data.command, 'blockMsgFlag: ', blockMsgFlag);
			socket.emit('MsgObjectServer', { message: data });
		}
	}
}