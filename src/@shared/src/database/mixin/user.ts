import type { Database, SqliteReturn } from "./_base";
import * as bcrypt from "bcrypt";

// never use this directly

export interface IUserDb extends Database {
	getUser(id: UserId): User | null,
	getUserFromName(name: string): User | null,
	getUserFromRawId(id: number): User | null,
	getUserOtpSecret(id: UserId): string | null,
	createUser(name: string, password: string | null): Promise<User | null>,
	setUserPassword(id: UserId, password: string | null): Promise<User | null>,
};

export const UserImpl: Omit<IUserDb, keyof Database> = {
	/**
	 * Get a user from an [UserId]
	 *
	 * @param id the userid to fetch
	 *
	 * @returns The user if it exists, null otherwise
	 */
	getUser(this: IUserDb, id: UserId): User | null {
		return this.getUserFromRawId(id);
	},

	/**
	 * Get a user from a username [string]
	 *
	 * @param name the username to fetch
	 *
	 * @returns The user if it exists, null otherwise
	 */
	getUserFromName(this: IUserDb, name: string): User | null {
		return userFromRow(
			this.prepare(
				"SELECT * FROM user WHERE name = @name LIMIT 1",
			).get({ name }),
		);
	},

	/**
	 * Get a user from a raw [UserId]
	 *
	 * @param id the userid to modify
	 *
	 * @returns The user if it exists, null otherwise
	 */
	getUserFromRawId(this: IUserDb, id: number): User | null {
		return userFromRow(
			this.prepare("SELECT * FROM user WHERE id = @id LIMIT 1").get({
				id,
			}) as SqliteReturn,
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
	async createUser(this: IUserDb, name: string, password: string | null): Promise<User | null> {
		password = await hashPassword(password);
		return userFromRow(
			this.prepare(
				"INSERT OR FAIL INTO user (name, password) VALUES (@name, @password) RETURNING *",
			).get({ name, password }),
		);
	},

	/**
	 * Set the hash of a password in the database for a specific user.
	 * You are required to hash the password before storing it in the database
	 *
	 * @param id the userid to modify
	 * @param password the plaintext password to store (can be null to remove password login)
	 *
	 * @returns The modified user if it exists, null otherwise
	 */
	async setUserPassword(this: IUserDb, id: UserId, password: string | null): Promise<User | null> {
		password = await hashPassword(password);
		return userFromRow(
			this.prepare(
				"UPDATE OR FAIL user SET password = @password WHERE id = @id RETURNING *",
			).get({ password, id }) as SqliteReturn,
		);
	},

	getUserOtpSecret(this: IUserDb, id: UserId): string | null {
		let otp: any = this.prepare("SELECT otp FROM user WHERE id = @id LIMIT 1").get({ id }) as SqliteReturn;
		console.log(otp);
		if (otp?.otp === undefined || otp?.otp === null) return null;
		return otp.otp;
	},
};

export type UserId = number & { readonly __brand: unique symbol };

export type User = {
	readonly id: UserId;
	readonly name: string;
	readonly password?: string;
	readonly otp?: string;
};

/**
 * Represent different state a "username" might be
 *
 * @enum V_valid The username is valid
 * @enum E_tooShort The username is too short
 * @enum E_tooLong The username is too long
 * @enum E_invalChar the username contains invalid characters (must be alphanumeric)
 *
 */
export const enum ValidUserNameRet {
	V_valid = "username.valid",
	E_tooShort = "username.tooShort",
	E_tooLong = "username.toLong",
	E_invalChar = "username.invalChar"
}

export function validUserName(username: string): ValidUserNameRet {
	if (username.length < 4)
		return ValidUserNameRet.E_tooShort;
	if (username.length > 16)
		return ValidUserNameRet.E_tooLong;
	if (!(RegExp("^[0-9a-zA-Z]$").test(username)))
		return ValidUserNameRet.E_invalChar;
	return ValidUserNameRet.V_valid;
}

export async function verifyUserPassword(
	user: User,
	password: string,
): Promise<boolean> {
	// The user doesn't have a password, so it can't match.
	// This is somewhat bad thing to do, since it is a time-attack vector, but I don't care ?
	if (user.password == null) return false;
	return await bcrypt.compare(password, user.password);
}

/**
 * Hash a password using the correct options
 *
 * @param password the plaintext password to hash (if any)\
 * @returns the bcrypt hashed password
 *
 * @note: This function will do nothing if [`null`] is passed (it'll return null directly)
 */
async function hashPassword(
	password: string | null,
): Promise<string | null> {
	if (password === null) return null;
	return await bcrypt.hash(password, 12);
}

/**
 * Get a user from a row
 *
 * @param row The data from sqlite
 *
 * @returns The user if it exists, null otherwise
 */
function userFromRow(row: any): User | null {
	if (row == null || row == undefined) return null;
	return {
		id: row.id as UserId,
		name: row.name || null,
		password: row.password || null,
	};
} 
