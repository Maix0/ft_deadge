//import sqlite from "better-sqlite3"
import { MixinBase } from "./_base"

// never use this directly


export const UserDb = function <TBase extends MixinBase>(Base: TBase) {
	return class extends Base {
		constructor(...args: any[]) {
			if (args.length != 1 && !(args[0] instanceof String))
				throw "Invalid arguments to mixing class"
			super(args[0]);
		}

		private userFromRow(row: any): User {
			throw "TODO: User from Row"
		}

		public getUser(id: UserId): User | null {
			return null
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
