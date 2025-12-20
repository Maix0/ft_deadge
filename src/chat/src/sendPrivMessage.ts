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

	const AllusersBlocked: User[] = fastify.db.getAllUsers() ?? [];
	const UserID = getUserByName(AllusersBlocked, data.user)?.id ?? '';
	const list:BlockRelation[] = whoBlockedMe(fastify, UserID);
	const sockets = await fastify.io.fetchSockets();
	const senderSocket = sockets.find(socket => socket.id === sender);
	for (const socket of sockets) {
		if (socket.id === sender) continue;
		const clientInfo = clientChat.get(socket.id);
		if (!clientInfo?.user) {
			console.log(color.yellow, `DEBUG LOG: Skipping socket ${socket.id} (no user found)`);
			continue;
		}
		let blockMsgFlag: boolean = false;
		const UserByID = getUserByName(AllusersBlocked, clientInfo.user)?.id ?? '';
		if (UserByID === '') {
			blockMsgFlag = checkNamePair(list, data.SenderUserID, UserByID) || false;
		}
		const user: string = clientChat.get(socket.id)?.user ?? '';
		const atUser = `@${user}`;
		if (atUser !== data.command || atUser === '') {
			console.log(color.yellow, `DEBUG LOG: User: '${atUser}' command NOT FOUND: '${data.command[0]}' `);
			continue;
		}
		if (data.text !== '') {
			if (!blockMsgFlag) {
				console.log(color.blue, 'Emit message: ', data.command, 'blockMsgFlag: ', blockMsgFlag);
				// socket.emit('MsgObjectServer', { message: data });
				console.log(color.yellow, `DEBUG LOG: User: '${atUser}' command FOUND: '${data.command}' `);
				if (senderSocket) {
					senderSocket.emit('privMessageCopy', `${data.command}: ${data.text}🔒`);
				}
			}
		}
		console.log(color.green, `DEBUG LOG: 'Priv to:', ${data.command} message: ${data.text}`);
	}
}
