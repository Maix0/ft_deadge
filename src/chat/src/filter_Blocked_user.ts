import type { ClientMessage } from './chat_types';
import { FastifyInstance } from 'fastify';
import type { User } from '@shared/database/mixin/user';
import { getUserById } from './getUserById';
import { isUser_BlockedBy_me } from './isUser_BlockedBy_me';

/**
 * function to check if blocked or not - checks with ID
 * @param fastify
 * @param data
 * @returns true or false - true if blocked user by a user
 */

export function filter_Blocked_user(fastify: FastifyInstance, data: ClientMessage, id: string): boolean {

	const users: User[] = fastify.db.getAllUsers() ?? [];
	const UserToBlock: string = id;
	const UserAskingToBlock: User | null = getUserById(users, `${data.SenderUserID}`);
	if (!UserAskingToBlock) {
		// console.log('SOMETHING NULL', data);
		// console.log('UsetToBlock', UserToBlock?.id);
		// console.log('UsetToBlock', UserToBlock?.name);
		// console.log('UsetAskingToBlock', UserAskingToBlock?.id);
		// console.log('UsetAskingToBlock', UserAskingToBlock?.name);
		return false;
	}
	if (isUser_BlockedBy_me(fastify, UserAskingToBlock!.id, UserToBlock)) {
		return true;
	}
	else {
		return false;
	}
}