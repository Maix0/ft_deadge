import type { User } from '@shared/database/mixin/user';
import type { BlockedData } from '@shared/database/mixin/blocked';

/**
 * function compares the four ids of two users and returns true if
 * UserA1 = UserB1 and UserB1 = UserB2
 * @param UserAskingToBlock
 * @param UserToBlock
 * @param usersBlocked
 * @returns
 */

export function isBlocked(UserAskingToBlock: User, UserToBlock: User, usersBlocked: BlockedData[]): boolean {
	return usersBlocked.some(blocked =>
	    blocked.blocked === UserToBlock?.id &&
	    blocked.user === UserAskingToBlock?.id);
}