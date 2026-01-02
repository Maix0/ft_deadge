import { FastifyInstance } from 'fastify';
import type { User } from '@shared/database/mixin/user';
import type { BlockedData } from '@shared/database/mixin/blocked';
import { isBlocked } from './isBlocked';
import { getUserById } from './getUserById';

/**
 * checks the Db for the two matching Ids
 * @param fastify
 * @param blockedBy_Id
 * @param isBlocked_Id
 * @returns Null if not blocked
 */

export function isUser_BlockedBy_me(fastify: FastifyInstance, blockedBy_Id : string, isBlocked_Id: string): string {
	const users: User[] = fastify.db.getAllUsers() ?? [];
	if (!users) return '';
	const UserToBlock: User | null = getUserById(users, `${isBlocked_Id}`);
	const UserAskingToBlock: User | null = getUserById(users, `${blockedBy_Id}`);
	if (!UserToBlock) {
		return '';
	}
	if (!UserAskingToBlock) {
		return '';
	}
	const usersBlocked: BlockedData[] = fastify.db.getAllBlockedUsers() ?? [];
	const userAreBlocked: boolean = isBlocked(UserAskingToBlock, UserToBlock, usersBlocked);
	if (userAreBlocked) {
		return UserAskingToBlock.name;
	}
	return '';
};
