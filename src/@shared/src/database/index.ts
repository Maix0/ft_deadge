import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

import { Database as DbImpl } from './mixin/_base';
import { IUserDb, UserImpl } from './mixin/user';
import { IBlockedDb, BlockedImpl } from './mixin/blocked';
import { ITicTacToeDb, TicTacToeImpl } from './mixin/tictactoe';

Object.assign(DbImpl.prototype, UserImpl);
Object.assign(DbImpl.prototype, BlockedImpl);
Object.assign(DbImpl.prototype, TicTacToeImpl);

export interface Database extends DbImpl, IUserDb, IBlockedDb, ITicTacToeDb { }

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
	export interface FastifyInstance {
		db: Database;
	}
}

let dbAdded = false;

export const useDatabase = fp<FastifyPluginAsync>(async function(
	f: FastifyInstance,
	_options: object,
) {
	void _options;
	if (dbAdded) {
		return;
	}
	dbAdded = true;
	const path = process.env.DATABASE_DIR ?? '/volumes/database';
	const db: Database = new DbImpl(`${path}/database.db`) as Database;
	if (!f.hasDecorator('db')) {
		f.decorate('db', db);
	}
});

export default useDatabase;
