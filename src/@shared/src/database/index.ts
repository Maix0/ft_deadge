import fp from 'fastify-plugin'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

import { Database as DbImpl } from "./mixin/_base";
import { UserImpl, IUserDb } from "./mixin/user";


Object.assign(DbImpl.prototype, UserImpl);

export interface Database extends DbImpl, IUserDb { }

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
	export interface FastifyInstance {
		db: Database;
	}
}

let dbAdded = false;

export const useDatabase = fp<FastifyPluginAsync>(async function(
	f: FastifyInstance,
	_options: {}) {
	if (dbAdded)
		return;
	dbAdded = true;
	let path = process.env.DATABASE_DIR;
	if (path === null || path === undefined)
		throw "env `DATABASE_DIR` not defined";
	f.log.info(`Opening database with path: ${path}/database.db`)
	let db: Database = new DbImpl(`${path}/database.db`) as Database;
	if (!f.hasDecorator("db"))
		f.decorate('db', db);
});

export * as user from "./mixin/user"
export default useDatabase;

