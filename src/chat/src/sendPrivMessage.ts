import type { ClientMessage } from './chat_types';
import { clientChat, color } from './app';
import { FastifyInstance } from 'fastify';
import { getUserByName } from './getUserByName';
import type { User } from '@shared/database/mixin/user';

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
		console.log(color.red, `'RETURN FLAG CheckNamePair ${exists}' item: ${name1}  item2: ${name2}`);
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

/**
 * function looks up the socket of a user online in the chat and sends a message
 * it also sends a copy of the message to the sender
 * @param fastify
 * @param data
 * @param sender
 */

export async function sendPrivMessage(fastify: FastifyInstance, data: ClientMessage, sender?: string) {

	const sockets = await fastify.io.fetchSockets();
	const AllusersBlocked: User[] = fastify.db.getAllUsers() ?? [];
	const senderSocket = sockets.find(socket => socket.id === sender);
	for (const socket of sockets) {
		const UserID = getUserByName(AllusersBlocked, data.user)?.id ?? '';
		const list:BlockRelation[] = whoBlockedMe(fastify, UserID);
		const clientInfo = clientChat.get(socket.id);
		if (!clientInfo?.user) {
			console.log(color.red, `Skipping socket ${socket.id} (no user found)`);
			continue;
		}
		let blockMsgFlag: boolean = false;
		const UserByID = getUserByName(AllusersBlocked, clientInfo.user) ?? '';
		if (UserByID === '') return;


		const user: string = clientChat.get(socket.id)?.user ?? '';
		const atUser = `@${user}`;
		if (atUser !== data.command || atUser === '' || data.text === '') {
			continue;
		}

		blockMsgFlag = checkNamePair(list, UserID, UserByID.id) || false;
		console.log(color.green, `USER ID: ${UserID} data.user: ${data.user} blockFlag: ${blockMsgFlag} userName: ${UserByID.name} iD:${UserByID.id}`);

		if (socket.id === sender) {
			console.log(color.blue, 'sKip Sender ', socket.id);
			continue;
		}
		console.log(color.yellow, `blockFlag=${blockMsgFlag}: Target ${clientInfo.user}`);
		if (!blockMsgFlag) {
			console.log(color.blue, 'Emit message: ', data.command, 'blockMsgFlag: ', blockMsgFlag);
			socket.emit('MsgObjectServer', { message: data });
			if (senderSocket) {
				senderSocket.emit('privMessageCopy', `${data.command}: ${data.text}🔒`);
			}
		}
	}
}
