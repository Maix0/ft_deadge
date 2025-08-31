import type { Database, SqliteReturn } from "./_base";
import { Otp } from "@shared/auth";
import { isNullish } from "@shared/utils";
import * as bcrypt from "bcrypt";

// never use this directly

export interface IUserDb extends Database {
	getUser(id: UserId): User | undefined,
	getUserFromName(name: string): User | undefined,
	getUserFromRawId(id: number): User | undefined,
	getUserOtpSecret(id: UserId): string | undefined,
	createUser(name: string, password: string | undefined): Promise<User | undefined>,
	setUserPassword(id: UserId, password: string | undefined): Promise<User | undefined>,
	ensureUserOtpSecret(id: UserId): string | undefined,
	deleteUserOtpSecret(id: UserId): void,
};

export const UserImpl: Omit<IUserDb, keyof Database> = {
	/**
	 * Get a user from an [UserId]
	 *
	 * @param id the userid to fetch
	 *
	 * @returns The user if it exists, undefined otherwise
	 */
	getUser(this: IUserDb, id: UserId): User | undefined {
		return this.getUserFromRawId(id);
	},

	/**
	 * Get a user from a username [string]
	 *
	 * @param name the username to fetch
	 *
	 * @returns The user if it exists, undefined otherwise
	 */
	getUserFromName(this: IUserDb, name: string): User | undefined {
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
	 * @returns The user if it exists, undefined otherwise
	 */
	getUserFromRawId(this: IUserDb, id: number): User | undefined {
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
	async createUser(this: IUserDb, name: string, password: string | undefined): Promise<User | undefined> {
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
	 * @param password the plaintext password to store (can be undefined to remove password login)
	 *
	 * @returns The modified user if it exists, undefined otherwise
	 */
	async setUserPassword(this: IUserDb, id: UserId, password: string | undefined): Promise<User | undefined> {
		password = await hashPassword(password);
		return userFromRow(
			this.prepare(
				"UPDATE OR FAIL user SET password = @password WHERE id = @id RETURNING *",
			).get({ password, id }) as SqliteReturn,
		);
	},

	getUserOtpSecret(this: IUserDb, id: UserId): string | undefined {
		let otp: any = this.prepare("SELECT otp FROM user WHERE id = @id LIMIT 1").get({ id }) as SqliteReturn;
		if (isNullish(otp?.otp)) return undefined;
		return otp.otp;
	},

	ensureUserOtpSecret(this: IUserDb, id: UserId): string | undefined {
		let otp = this.getUserOtpSecret(id);
		if (!isNullish(otp))
			return otp;
		let otpGen = new Otp();
		const res: any = this.prepare("UPDATE OR IGNORE user SET otp = @otp WHERE id = @id RETURNING otp")
			.get({ id, otp: otpGen.secret });
		if (isNullish(res?.otp)) return undefined;
		return res?.otp;
	},

	deleteUserOtpSecret(this: IUserDb, id: UserId): void {
		this.prepare("UPDATE OR IGNORE user SET otp = NULL WHERE id = @id").run({ id });
	}
};

export type UserId = number & { readonly __brand: unique symbol };

export type User = {
	readonly id: UserId;
	readonly name: string;
	readonly password?: string;
	readonly otp?: string;
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
function userFromRow(row: any): User | undefined {
	if (isNullish(row)) return undefined;
	return {
		id: row.id as UserId,
		name: row.name || undefined,
		password: row.password || undefined,
		otp: row.otp || undefined,
	};
} 
