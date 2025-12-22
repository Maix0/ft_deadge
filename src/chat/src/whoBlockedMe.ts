import { FastifyInstance } from 'fastify';
import type { BlockRelation} from './chat_types';

export function whoBlockedMe(fastify: FastifyInstance, myID: string): BlockRelation [] {
	const usersBlocked =
		fastify.db.getAllBlockedUsers() ?? [];

	return usersBlocked
		.filter(entry  => entry.blocked === myID)
		.map(entry => ({
			blocked: entry.user,
			blocker: entry.blocked,
		}));
}


