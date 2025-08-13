import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'

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

export type DatabaseOption = {
	path: string;
};

export const useDatabase = fp<DatabaseOption>(async function(
	f: FastifyInstance,
	_options: DatabaseOption) {
	f.log.info("Database has been hooked up to fastify ?!");
	f.log.warn("TODO: actually hook up database to fastify...");
	f.decorate('db', new Database(_options.path));
});

export default useDatabase;

