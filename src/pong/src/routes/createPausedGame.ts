import { isNullish, MakeStaticResponse, typeResponse } from '@shared/utils';
import { FastifyPluginAsync } from 'fastify';
import { Static, Type } from 'typebox';
import { State } from '../state';
import { UserId } from '@shared/database/mixin/user';

const CreatePausedGameParam = Type.Object({
	user1: Type.String({ description: '\'id\' | <userid>' }),
	user2: Type.String({ description: '\'id\' | <userid>' }),
});

type CreatePausedGameParam = Static<typeof CreatePausedGameParam>;

const CreatePausedGameResponse = {
	'200': typeResponse('success', 'createPausedGame.success', {
		gameId: Type.String({ description: 'gameId' }),
	}),
	'404': typeResponse('failure', 'createPausedGame.generic.fail'),
};

type CreatePausedGameResponse = MakeStaticResponse<typeof CreatePausedGameResponse>;

const route: FastifyPluginAsync = async (fastify): Promise<void> => {
	fastify.post<{ Body: CreatePausedGameParam }>(
		'/createPausedGame',
		{
			schema: {
				body: CreatePausedGameParam,
				response: CreatePausedGameResponse,
				operationId: 'pongCreatePauseGame',
			},
		},
		async function(req, res) {
			const resp = State.newPausedGame(req.body.user1 as UserId, req.body.user2 as UserId);

			if (isNullish(resp)) { return (res.makeResponse(404, 'failure', 'createPausedGame.generic.fail')); }
			// else
			return (res.makeResponse(200, 'success', 'createPausedGame.success'));
		},
	);
};
export default route;