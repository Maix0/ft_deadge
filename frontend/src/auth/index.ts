import { showError } from "@app/toast";
import client from '@app/api';

export type User = {
	id: string;
	guest: boolean;
	name: string;
	selfInfo?: {
		loginName?: string;
		provider_id?: string;
		provider_user?: string;
	}
};

let currentUser: User | null = null;

export function getUser(): Readonly<User> | null {
	return currentUser;
}

export function isLogged(): boolean {
	return currentUser !== null;
}

export function setUser(newUser: User | null) {
	currentUser = newUser;
}

export async function updateUser(): Promise<Readonly<User> | null> {
	try {
		let res = await client.getUser({ user: 'me' });

		if (res.kind === "success") {
			setUser(res.payload);
			return res.payload;
		} else if (res.kind === "failure") {
			// well no user :D
			setUser(null);
			return null;
		} else if (res.kind === "notLoggedIn") {
			setUser(null);
			return null;
		} else {
			setUser(null);
			showError(`unknown response: ${JSON.stringify(res)}`);
			return null;
		}
	} catch (e) {
		setUser(null);
		showError(`failed to get user: ${e}`);
		return null;
	}
}

Object.assign(window as any, { getUser, setUser, updateUser, isLogged });

