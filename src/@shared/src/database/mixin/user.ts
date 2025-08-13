//import sqlite from "better-sqlite3"
import Joi from "joi"
import { MixinBase, SqliteReturn } from "./_base"

// never use this directly

const schema = Joi.object({
	id: Joi.number(),
	name: Joi.string(),
	password: Joi.string().optional().allow(null),
	salt: Joi.string().optional().allow(null),
})


export const UserDb = function <TBase extends MixinBase>(Base: TBase) {
	return class extends Base {
		constructor(...args: any[]) {
			if (args.length != 1 && !(args[0] instanceof String))
				throw "Invalid arguments to mixing class"
			super(args[0]);
		}

		private userFromRow(row: any): User {
			const v = Joi.attempt(row, schema);
			return {
				id: v.id as UserId,
				name: v.name || null,
				password: v.password || null,
				salt: v.salt,
			}
		}

		public getUser(id: UserId): User | null {
			return this.getUserFromRawId(id);
		}

		public getUserFromRawId(id: number): User | null {
			let res = this.prepare('SELECT * FROM user WHERE id = ?').get(id) as SqliteReturn;
			if (res === null || res === undefined) return null;
			return this.userFromRow(res);
		}

		public setUser(id: UserId, partialUser: Partial<Omit<User, 'id'>>): User | null {
			return null
		}

	}
}

export type UserId = number & { readonly __brand: unique symbol };

export type User = {
	readonly id: UserId,
	readonly name: string,
	readonly salt: string,
	readonly password: string,
};
