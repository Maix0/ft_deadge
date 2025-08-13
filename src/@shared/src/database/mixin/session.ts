//import sqlite from "better-sqlite3"
import { MixinBase } from "./_base"

// never use this directly

export const SessionDb = function <TBase extends MixinBase>(Base: TBase) {
	return class extends Base {
		constructor(...args: any[]) {
			if (args.length != 1 && !(args[0] instanceof String))
				throw "Invalid arguments to mixing class"
			super(args[0]);
		}

		public getSessionFromId(id: SessionId): Session | null {
			return null
		}
	}
}

export type SessionId = number & { readonly __brand: unique symbol };

export type Session = {
	readonly id: SessionId,
	readonly name: string,
	readonly salt: string,
	readonly password: string,
};
