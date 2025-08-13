import fp from 'fastify-plugin'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

import { Base } from "./mixin/_base";
import { UserDb } from "./mixin/user";
import { SessionDb } from "./mixin/session";

class Database extends UserDb(SessionDb(Base as any)) {
	constructor(path: string) {
		super(path);
	}
}

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
	export interface FastifyInstance {
		db: Database;
	}
}

export const useDatabase = fp<FastifyPluginAsync>(async function(
	f: FastifyInstance,
	_options: {}) {

	let path = process.env.DATABASE_DIR;
	if (path === null || path === undefined)
		throw "env `DATABASE_DIR` not defined";
	f.log.info(`Opening database with path: ${path}/database.db`)
	f.decorate('db', new Database(`${path}/database.db`));
});

export default useDatabase;

