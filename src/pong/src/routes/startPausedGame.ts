import { MakeStaticResponse, typeResponse } from '@shared/utils';
import { FastifyPluginAsync } from 'fastify';
import Type, { Static } from 'typebox';
import { State } from '../state';
import { PongGameId } from '@shared/database/mixin/pong';

const startPausedGameParam = Type.Object({
	gameId: Type.String({ description: '\'id\' | <gameid>' }),
});

type startPausedGameParam = Static<typeof startPausedGameParam>;

const startPausedGameResponse = {
	'200': typeResponse('success', 'startPausedGame.success', {}),
	'404': typeResponse('failure', 'startPausedGame.no_such_game'),
};

type startPausedGameResponse = MakeStaticResponse<typeof startPausedGameResponse>;

const route: FastifyPluginAsync = async (fastify): Promise<void> => {
	fastify.post<{ Body: startPausedGameParam }>(
		'/startPausedGame',
		{
			schema: {
				body: startPausedGameParam,
				response: startPausedGameResponse,
				operationId: 'pongstartPauseGame',
			},
		},
		async function(req, res) {
			const resp = State.startPausedGame(req.body.gameId as PongGameId);

			if (resp !== true) { return (res.makeResponse(404, 'failure', 'startPausedGame.generic.fail')); }
			// else
			return (res.makeResponse(200, 'success', 'startPausedGame.success'));
		},
	);
};
export default route;