import type { Database, SqliteReturn } from './_base';
import { Otp } from '@shared/auth';
import { isNullish } from '@shared/utils';
import * as bcrypt from 'bcrypt';
import { UUID, newUUID } from '@shared/utils/uuid';
import { SqliteError } from 'better-sqlite3';

// never use this directly

export interface IUserDb extends Database {
	getUserFromLoginName(name: string): User | undefined,
	getUser(id: string): User | undefined,
	getOauth2User(provider: string, unique: string): User | undefined,
	getUserOtpSecret(id: UserId): string | undefined,
	createUser(login: string | null, name: string, password: string): Promise<User | undefined>,
	createGuestUser(name: string): Promise<User | undefined>,
	createOauth2User(name: string, provider: string, provider_unique: string): Promise<User | undefined>,
	setUserPassword(id: UserId, password: string | undefined): Promise<User | undefined>,
	ensureUserOtpSecret(id: UserId): string | undefined,
	deleteUserOtpSecret(id: UserId): void,
	getAllUserFromProvider(provider: string): User[] | undefined,
	getAllUsers(this: IUserDb): User[] | undefined,


	updateDisplayName(id: UserId, new_name: string): boolean,
	getUserFromDisplayName(name: string): User | undefined,

	setUserDescription(id: UserId, newDescription: string): void,
	getUserDescription(id: UserId): string | undefined,

	allowGuestMessage(id: UserId): void,
	denyGuestMessage(id: UserId): void,
	getGuestMessage(id: UserId): boolean | undefined,

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
				'SELECT * FROM user WHERE login = @name LIMIT 1',
			).get({ name }) as (Partial<User> | undefined),
		);
	},

	getAllUsers(this: IUserDb): User[] {
		const rows = this.prepare('SELECT * FROM user').all() as Partial<User>[];

		return rows
			.map(row => userFromRow(row))
			.filter((u): u is User => u !== undefined);
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
	async createUser(this: IUserDb, login: string, name: string, password: string): Promise<User | undefined> {
		const password_ = await hashPassword(password);
		const id = newUUID();
		return userFromRow(
			this.prepare(
				'INSERT OR FAIL INTO user (id, login, name, password, guest, oauth2) VALUES (@id, @login, @name, @password, @guest, @oauth2) RETURNING *',
			).get({ id, login, name, password: password_, guest: 0, oauth2: null }) as (Partial<User> | undefined),
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
	async createGuestUser(this: IUserDb, name: string): Promise<User | undefined> {
		const id = newUUID();
		return userFromRow(
			this.prepare(
				'INSERT OR FAIL INTO user (id, login, name, password, guest, oauth2) VALUES (@id, @login, @name, @password, @guest, @oauth2) RETURNING *',
			).get({ id, login: null, name, password: null, guest: 1, oauth2: null }) as (Partial<User> | undefined),
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
	async createOauth2User(this: IUserDb, name: string, provider: string, provider_unique: string): Promise<User | undefined> {
		const id = newUUID();
		return userFromRow(
			this.prepare(
				'INSERT OR FAIL INTO user (id, login, name, password, guest, oauth2) VALUES (@id, @login, @name, @password, @guest, @oauth2) RETURNING *',
			).get({ id, login: null, name, password: null, guest: 0, oauth2: `${provider}:${provider_unique}` }) as (Partial<User> | undefined),
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

	getAllUserFromProvider(this: IUserDb, provider: string): User[] | undefined {
		const req = this.prepare('SELECT * FROM user WHERE oauth2 LIKE oauth2 = @oauth2 || \'%\'');
		return (req.all({ oauth2: provider }) as Partial<User>[]).map(userFromRow).filter(v => !isNullish(v));
	},
	getOauth2User(this: IUserDb, provider: string, unique: string): User | undefined {
		const req = this.prepare('SELECT * FROM user WHERE oauth2 = @oauth2').get({ oauth2: `${provider}:${unique}` }) as Partial<User> | undefined;
		return userFromRow(req);
	},

	updateDisplayName(this: IUserDb, id: UserId, new_name: string): boolean {
		try {
			this.prepare('UPDATE OR FAIL user SET name = @new_name WHERE id = @id').run({ id, new_name });
			return true;
		}
		catch (e) {
			if (e instanceof SqliteError) {
				if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return false;
			}
			throw e;
		}
	},

	getUserFromDisplayName(this: IUserDb, name: string) {
		const res = this.prepare('SELECT * FROM user WHERE name = @name LIMIT 1').get({ name }) as User | undefined;
		return userFromRow(res);
	},


	setUserDescription(this: IUserDb, id: UserId, desc: string): void {
		this.prepare('UPDATE OR IGNORE user SET desc = @desc WHERE id = @id').run({ id, desc });
	},

	getUserDescription(this: IUserDb, id: UserId): string | undefined {
		return this.prepare('SELECT desc FROM user WHERE id = @id').get({ id }) as string | undefined;
	},

	allowGuestMessage(this: IUserDb, id: UserId): void {
		this.prepare('UPDATE OR IGNORE user SET allow_guest_message = @allow_guest_message WHERE id = @id').run({ id, allow_guest_message: 1 });
	},

	denyGuestMessage(this: IUserDb, id: UserId): void {
		this.prepare('UPDATE OR IGNORE user SET allow_guest_message = @allow_guest_message WHERE id = @id').run({ id, allow_guest_message: 0 });

	},

	getGuestMessage(this: IUserDb, id: UserId): boolean | undefined {
		const result = this.prepare('SELECT allow_guest_message FROM user WHERE id = @id').get({ id }) as {
			allow_guest_message: number
		} | undefined
		
		return Boolean(result?.allow_guest_message)
	},
};

export type UserId = UUID;

export type User = {
	readonly id: UserId;
	readonly login?: string;
	readonly name: string;
	readonly password?: string;
	readonly otp?: string;
	readonly guest: boolean;
	// will be split/merged from the `oauth2` column
	readonly provider_name?: string;
	readonly provider_unique?: string;

	readonly allow_guest_message: boolean,
	readonly desc: string,
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
export function userFromRow(row?: Partial<Omit<User, 'provider_name' | 'provider_unique'> & { oauth2?: string }>): User | undefined {
	if (isNullish(row)) return undefined;
	if (isNullish(row.id)) return undefined;
	if (isNullish(row.name)) return undefined;
	if (isNullish(row.guest)) return undefined;
	if (isNullish(row.desc)) return undefined;
	if (isNullish(row.allow_guest_message)) return undefined;

	let provider_name = undefined;
	let provider_unique = undefined;

	if (row.oauth2) {
		const splitted = row.oauth2.split(/:(.*)/);
		if (splitted.length != 3) { return undefined; }
		provider_name = splitted[0];
		provider_unique = splitted[1];
	}

	return {
		id: row.id,
		login: row.login ?? undefined,
		name: row.name,
		password: row.password ?? undefined,
		otp: row.otp ?? undefined,
		guest: !!(row.guest ?? true),
		provider_name, provider_unique,
		allow_guest_message: !!(row.allow_guest_message ?? true),
		desc: row.desc ?? 'NO DESC ????',
	};
}
