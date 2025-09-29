import sqlite from 'better-sqlite3';

// @ts-expect-error: this file is included using vite, typescript doesn't know how to include this...
import initSql from '../init.sql?raw';

export type SqliteReturn = object | undefined;

// Only way to use the database. Everything must be done through this.
// Prefer to use prepared statement `using this.db.prepare`
//
// this is the base, meaning that no actual query are made from this file.
// To create a new query function, go open another file, create a class that inherit from this class
// in the `index.ts` file, import the new class, and make the `Database` class inherit it
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
	public destroy(): void {
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
	protected prepare(query: string): sqlite.Statement {
		let st = this.st.get(query);
		if (st !== undefined) return st;

		st = this.db.prepare(query);
		this.st.set(query, st);
		return st;
	}
}
