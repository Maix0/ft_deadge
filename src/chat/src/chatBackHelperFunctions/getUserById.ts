import type { User } from '@shared/database/mixin/user';
/**
 * function get the object user in an array of users[] by name
 * @param users
 * @param name
 * @returns
 */
export function getUserById(users: User[], id: string) {
	return users.find(user => user.id === id) || null;
};
