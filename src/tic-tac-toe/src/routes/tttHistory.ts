import { UserId } from '@shared/database/mixin/user';
import { isNullish, MakeStaticResponse, typeResponse } from '@shared/utils';
import { FastifyPluginAsync } from 'fastify';
import { Static, Type } from 'typebox';

const TTTHistoryParams = Type.Object({
	user: Type.String({ description: '\'me\' | <userid>' }),
});

type TTTHistoryParams = Static<typeof TTTHistoryParams>;

const TTTHistoryResponse = {
	'200': typeResponse('success', 'ttthistory.success', {
		data: Type.Array(
			Type.Object({
				gameId: Type.String({ description: 'gameId' }),
				playerX: Type.Object({ id: Type.String(), name: Type.String() }),
				playerO: Type.Object({ id: Type.String(), name: Type.String() }),
				date: Type.String(),
				outcome: Type.Enum(['winX', 'winO', 'other', 'draw']),
			}),
		),
	}),
	'404': typeResponse('failure', 'ttthistory.failure.notfound'),
};
type TTTHistoryResponse = MakeStaticResponse<typeof TTTHistoryResponse>;

const route: FastifyPluginAsync = async (fastify): Promise<void> => {
	fastify.get<{ Params: TTTHistoryParams }>(
		'/api/ttt/history/:user',
		{
			schema: {
				params: TTTHistoryParams,
				response: TTTHistoryResponse,
				operationId: 'tttHistory',
			},
			config: { requireAuth: true },
		},
		async function(req, res) {
			if (req.params.user === 'me') { req.params.user = req.authUser!.id; }
			const user = this.db.getUser(req.params.user);
			if (isNullish(user)) { return res.makeResponse(404, 'failure', 'ttthistory.failure.notfound'); }
			const data = this.db.getAllTTTGameForUser(req.params.user as UserId);
			if (isNullish(data)) { return res.makeResponse(404, 'failure', 'ttthistory.failure.notfound'); }

			return res.makeResponse(200, 'success', 'ttthistory.success', {
				data: data.map(v => ({
					gameId: v.id,
					playerX: { id: v.playerX, name: v.nameX },
					playerO: { id: v.playerO, name: v.nameO },
					date: v.time.toString(),
					outcome: v.outcome,
				})),
			});
		},
	);
};
export default route;
