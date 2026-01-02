import { FastifyInstance } from 'fastify';
import type { ClientProfil } from './chat_types';
import type { User } from '@shared/database/mixin/user';
import { getUserByName } from './getUserByName';
import { Socket } from 'socket.io';
import { escape } from '@shared/utils';

/**
 * function makeProfil - translates the Users[] to a one user looking by name
 * and puts it into ClientProfil format
 * @param fastify
 * @param user
 * @param socket
 * @returns
 */

export async function makeProfil(fastify: FastifyInstance, user: string, socket: Socket): Promise<ClientProfil> {

	let clientProfil!: ClientProfil;
	const users: User[] = fastify.db.getAllUsers() ?? [];
	const allUsers: User | null = getUserByName(users, user);
	// console.log(color.yellow, `DEBUG LOG: 'userFound is:'${allUsers?.name}`);
	if (user === allUsers?.name) {
		// console.log(color.yellow, `DEBUG LOG: 'login Name: '${allUsers.login}' user: '${user}'`);
		clientProfil =
		{
			command: 'makeProfil',
			destination: 'profilMsg',
			type: 'chat' as const,
			user: `${allUsers.name}`,
			loginName: `${allUsers?.login ?? 'Guest'}`,
			userID: `${allUsers?.id ?? ''}`,
			text: escape(allUsers.desc),
			timestamp: Date.now(),
			SenderWindowID: socket.id,
			SenderName: '',
			Sendertext: '',
			SenderID: '',
			innerHtml: '',
		};
	}
	else {
		clientProfil =
		{
			command: 'makeProfil',
			destination: 'profilMsg',
			type: 'chat' as const,
			user: user,
			loginName: 'Not Found',
			userID: 'Not Found',
			text: 'Not Found',
			timestamp: Date.now(),
			SenderWindowID: socket.id,
			SenderName: '',
			Sendertext: '',
			SenderID: '',
			innerHtml: '',
		};

	}
	return clientProfil;
};
