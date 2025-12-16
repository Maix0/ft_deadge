import type { User } from '@shared/database/mixin/user';
/**
 * function get the object user in an array of users[] by name
 * @param users
 * @param name
 * @returns
 */
export function getUserByName(users: User[], name: string) {
	return users.find(user => user.name === name) || null;
}