import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import sqlite from 'better-sqlite3'

// @ts-ignore: this file is included using vite, typescript doesn't know how to include this...
import initSql from "./init.sql?raw"

/**
 * represent a unique user (by its ID.)
 * Having this means that the user does exist (aka it hasn't been deleted)
 */
export type UserID = number & { readonly __brand: unique symbol };
/**
 * The full representation of an user
 *
 * @property id [UserID]: The id of the user (unique)
 * @property name [string]: The username of the user (unique)
 * @property password [?string]: The password hash of the user (if password is defined)
 */
export type DbUser = {
	readonly id: UserID,
	readonly name: string,
	readonly password: string | null,
};

// Only way to use the database. Everything must be done through this.
// Prefer to use prepared statement `using this.db.prepare`
export class Database {
	private db: sqlite.Database;
	private st: Map<string, sqlite.Statement> = new Map();


	/**
	 * Create a new instance of the database, and init it to a known state
	 * the file ./init.sql will be ran onto the database, creating any table that might be missing
	 */
	constructor(db_path: string) {
		this.db = sqlite(db_path, {});
		this.db.pragma('journal_mode = WAL');
		this.db.transaction(() => this.db.exec(initSql))();
	}

	/**
	 * close the database
	 */
	destroy(): void {
		// remove any statement from the cache
		this.st.clear();
		// close the database
		this.db?.close();
	}

	/**
	 * use this to create queries. This will create statements (kinda expensive) and cache them
	 * since they will be cached, this means that they are only created once,
	 * otherwise they'll be just spat out from the cache
	 * the statements are cached by the {query} argument, 
	 * meaning that if you try to make two identiqual statement, but with different {query} they won't be cached
	 *
	 * @example this.prepare('SELECT * FROM users WHERE id = ?')
	 * @example this.prepare('SELECT * FROM users LIMIT 100 OFFSET ?')
	 */
	private prepare(query: string): sqlite.Statement {
		let st = this.st.get(query);
		if (st !== undefined) return st;

		st = this.db.prepare(query);
		this.st.set(query, st);
		return st;
	}

	public getUser(user: UserID): DbUser {

	};
}

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
	export interface FastifyInstance {
		db: Database;
	}
}

export type DatabaseOption = {
	path: string;
};

export const useDatabase = fp<DatabaseOption>(async function(
	f: FastifyInstance,
	_options: DatabaseOption) {
	f.log.info("Database has been hooked up to fastify ?!");
	f.log.warn("TODO: actually hook up database to fastify...");
});

export default useDatabase;

