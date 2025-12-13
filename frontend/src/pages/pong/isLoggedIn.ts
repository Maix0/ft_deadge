import { getUser } from "@app/auth";
import type { User } from '@app/auth'
/**
 * function checks if logged in
 * @returns either user | null
 */
export function isLoggedIn(): User | null {
	return getUser() || null;
};