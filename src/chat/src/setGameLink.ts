import { FastifyInstance } from 'fastify';
import type { ClientProfil } from './chat_types';
import { PongGameId } from '@shared/database/mixin/pong';


export async function setGameLink(fastify: FastifyInstance, data: string): Promise<PongGameId | undefined> {
	const profilInvite: ClientProfil = JSON.parse(data) || '';

	const payload = { 'user1': profilInvite.SenderID, 'user2':profilInvite.userID };
	try {
		const resp = await fetch('http://app-pong/api/pong/createPausedGame', {
			method: 'POST',
			headers: { 'Content-type': 'application/json' },
			body: JSON.stringify(payload),
		});
		if (!resp.ok) {
			throw (resp);
		}
		else {
			fastify.log.info('game-end info to chat success');
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const json = await resp.json() as any;
		fastify.log.info(json);
		return json.payload.gameId;
	}
	// disable eslint for err catching
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	catch (e: any) {
		fastify.log.error(`game-end info to chat failed: ${e}`);
	}
};