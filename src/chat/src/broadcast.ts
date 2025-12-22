import type { ClientMessage } from './chat_types';
import { clientChat } from './app';
import { FastifyInstance } from 'fastify';
import { getUserByName } from './getUserByName';
import type { User } from '@shared/database/mixin/user';
import { color } from './app';

type BlockRelation = {
	blocked: string;
	blocker: string;
};

function checkNamePair(list: BlockRelation[], name1: string, name2: string): (boolean) {
	const matches: BlockRelation[] = [];
	let exists: boolean = false;
	for (const item of list) {
		if (item.blocker === name1) {
			matches.push(item);
			if (item.blocked === name2) {
			  exists = true;
			  return true;;
			}
		}
	}
	return exists;
}

function whoBlockedMe(fastify: FastifyInstance, myID: string): BlockRelation [] {
	const usersBlocked =
		fastify.db.getAllBlockedUsers() ?? [];

	return usersBlocked
		.filter(entry => entry.blocked === myID)
		.map(entry => ({
			blocked: entry.user,
			blocker: entry.blocked,
		}));
}

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