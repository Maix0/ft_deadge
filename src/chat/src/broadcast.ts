import type { ClientMessage } from './chat_types';
import { clientChat } from './app';
import { FastifyInstance } from 'fastify';
import { getUserByName } from './getUserByName';
import type { User } from '@shared/database/mixin/user';

type BlockRelation = {
	blocked: string;
	blocker: string;
};

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

export function broadcast(fastify: FastifyInstance, data: ClientMessage, sender?: string) {

	const AllusersBlocked: User[] = fastify.db.getAllUsers() ?? [];
	// console.log(color.yellow, 'me:', getUserByName(AllusersBlocked, data.user)?.id)
	const UserID = getUserByName(AllusersBlocked, data.user)?.id ?? '';
	const list:BlockRelation[] = whoBlockedMe(fastify, UserID);
	const blockers = list.map(read => read.blocker);
	const blocked = list.map(read => read.blocked);
	console.log('All blockers:', blockers);
	console.log('All blocked:', blocked);
	// console.log(color.yellow, 'list:', list)
	fastify.io.fetchSockets().then((sockets) => {
		for (const socket of sockets) {
			// Skip sender's own socket
			if (socket.id === sender) continue;
			// Get client name from map
			const clientInfo = clientChat.get(socket.id);
			if (!clientInfo?.user) {
				// console.log(color.yellow, `Skipping socket ${socket.id} (no user found)`);
				continue;
			}
			// console.log('BLOCKED MAYBE', getUserById(sender));
			// console.log('TARGET',socket.id );
			// Emit structured JSON object
			// const UserID = getUserByName(AllusersBlocked, data.user)?.name ?? "";
			// const UserByID = getUserByName(AllusersBlocked, data.user)?.id ?? "";
			// console.log(color.blue, 'Asking:', UserID);
			// console.log(color.blue, 'Asking ID:', UserByID);
			console.log('Blocked list:', list);
			// console.log('Sender ID:', UserByID);
			// if (!list.includes(UserByID)) {
			// 	console.log('TRUE → sender NOT blocked');
			// } else {
			// 	console.log('FALSE → sender IS blocked');
			// }
			// if (list.filter(entry => entry.blocker === UserByID)) continue;
			socket.emit('MsgObjectServer', { message: data });
			// Debug logs
			// console.log(color.green, `'DEBUG LOG: Broadcast to:', ${data.command} message: ${data.text}`);
		}
	});
}