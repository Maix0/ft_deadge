import type { Database, SqliteReturn } from './_base';
import { Otp } from '@shared/auth';
import { isNullish } from '@shared/utils';
import * as bcrypt from 'bcrypt';
import { UUID, newUUID } from '@shared/utils/uuid';

// never use this directly

export interface IUserDb extends Database {
	getUserFromLoginName(name: string): User | undefined,
	getUser(id: string): User | undefined,
	getUserOtpSecret(id: UserId): string | undefined,
	createUser(login_name: string | null, display_name: string, password: string | undefined, guest: boolean): Promise<User | undefined>,
	createUser(login_name: string | null, display_name: string, password: string | undefined): Promise<User | undefined>,
	setUserPassword(id: UserId, password: string | undefined): Promise<User | undefined>,
	ensureUserOtpSecret(id: UserId): string | undefined,
	deleteUserOtpSecret(id: UserId): void,
};

export const UserImpl: Omit<IUserDb, keyof Database> = {
	/**
	 * Get a user from a username [string]
	 *
	 * @param name the username to fetch
	 *
	 * @returns The user if it exists, undefined otherwise
	 */
	getUserFromLoginName(this: IUserDb, name: string): User | undefined {
		return userFromRow(
			this.prepare(
				'SELECT * FROM user WHERE login_name = @name LIMIT 1',
			).get({ name }) as (Partial<User> | undefined),
		);
	},

	/**
	 * Get a user from a raw [UserId]
	 *
	 * @param id the userid to modify
	 *
	 * @returns The user if it exists, undefined otherwise
	 */
	getUser(this: IUserDb, id: string): User | undefined {
		return userFromRow(
			this.prepare('SELECT * FROM user WHERE id = @id LIMIT 1').get({
				id,
			}) as (Partial<User> | undefined),
		);
	},

	/**
	 * Create a new user using password hash
	 *
	 * @param name the username for the new user (must be unique and sanitized)
	 * @param password the plaintext password of the new user (if any)
	 *
	 * @returns The user struct
	 */
	async createUser(this: IUserDb, login_name: string | null, display_name: string, password: string | undefined, guest: boolean = false): Promise<User | undefined> {
		password = await hashPassword(password);
		const id = newUUID();
		return userFromRow(
			this.prepare(
				'INSERT OR FAIL INTO user (id, login_name, display_name, password, guest) VALUES (@id, @login_name, @display_name, @password, @guest) RETURNING *',
			).get({ id, login_name, display_name, password, guest: guest ? 1 : 0 }) as (Partial<User> | undefined),
		);
	},

	/**
	 * Set the hash of a password in the database for a specific user.
	 * You are required to hash the password before storing it in the database
	 *
	 * @param id the userid to modify
	 * @param password the plaintext password to store (can be undefined to remove password login)
	 *
	 * @returns The modified user if it exists, undefined otherwise
	 */
	async setUserPassword(this: IUserDb, id: UserId, password: string | undefined): Promise<User | undefined> {
		password = await hashPassword(password);
		return userFromRow(
			this.prepare(
				'UPDATE OR FAIL user SET password = @password WHERE id = @id RETURNING *',
			).get({ password, id }) as SqliteReturn,
		);
	},

	getUserOtpSecret(this: IUserDb, id: UserId): string | undefined {
		const otp = this.prepare('SELECT otp FROM user WHERE id = @id LIMIT 1').get({ id }) as ({ otp: string } | null | undefined);
		if (isNullish(otp?.otp)) return undefined;
		return otp.otp;
	},

	ensureUserOtpSecret(this: IUserDb, id: UserId): string | undefined {
		const otp = this.getUserOtpSecret(id);
		if (!isNullish(otp)) { return otp; }
		const otpGen = new Otp();
		const res = this.prepare('UPDATE OR IGNORE user SET otp = @otp WHERE id = @id RETURNING otp')
			.get({ id, otp: otpGen.secret }) as ({ otp: string } | null | undefined);
		return res?.otp;
	},

	deleteUserOtpSecret(this: IUserDb, id: UserId): void {
		this.prepare('UPDATE OR IGNORE user SET otp = NULL WHERE id = @id').run({ id });
	},
};

export type UserId = UUID;

export type User = {
	readonly id: UserId;
	readonly login_name?: string;
	readonly display_name: string;
	readonly password?: string;
	readonly otp?: string;
	readonly guest: boolean;
};

export async function verifyUserPassword(
	user: User,
	password: string,
): Promise<boolean> {
	// The user doesn't have a password, so it can't match.
	// This is somewhat bad thing to do, since it is a time-attack vector, but I don't care ?
	if (isNullish(user.password)) return false;
	return await bcrypt.compare(password, user.password);
}

/**
 * Hash a password using the correct options
 *
 * @param password the plaintext password to hash (if any)\
 * @returns the bcrypt hashed password
 *
 * @note: This function will do nothing if [`undefined`] is passed (it'll return undefined directly)
 */
async function hashPassword(
	password: string | undefined,
): Promise<string | undefined> {
	if (isNullish(password)) return undefined;
	return await bcrypt.hash(password, 12);
}

/**
 * Get a user from a row
 *
 * @param row The data from sqlite
 *
 * @returns The user if it exists, undefined otherwise
 */
export function userFromRow(row?: Partial<User>): User | undefined {
	if (isNullish(row)) return undefined;
	if (isNullish(row.id)) return undefined;
	if (isNullish(row.display_name)) return undefined;
	if (isNullish(row.guest)) return undefined;
	return {
		id: row.id,
		login_name: row.login_name ?? undefined,
		display_name: row.display_name,
		password: row.password ?? undefined,
		otp: row.otp ?? undefined,
		guest: !!(row.guest ?? true),
	};
}
