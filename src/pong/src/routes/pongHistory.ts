import { UserId } from '@shared/database/mixin/user';
import { isNullish, MakeStaticResponse, typeResponse } from '@shared/utils';
import { FastifyPluginAsync } from 'fastify';
import { Static, Type } from 'typebox';

const PongHistoryParams = Type.Object({
	user: Type.String({ description: '\'me\' | <userid>' }),
});

type PongHistoryParams = Static<typeof PongHistoryParams>;

const PongHistoryResponse = {
	'200': typeResponse('success', 'ponghistory.success', {
		data: Type.Array(
			Type.Object({
				gameId: Type.String({ description: 'gameId' }),
				left: Type.Object({
					score: Type.Integer(),
					id: Type.String(),
					name: Type.String(),
				}),
				right: Type.Object({
					score: Type.Integer(),
					id: Type.String(),
					name: Type.String(),
				}),
				local: Type.Boolean(),
				date: Type.String(),
				outcome: Type.Enum(['winL', 'winR', 'other']),
			}),
		),
	}),
	'404': typeResponse('failure', 'ponghistory.failure.notfound'),
};
type PongHistoryResponse = MakeStaticResponse<typeof PongHistoryResponse>;

const route: FastifyPluginAsync = async (fastify): Promise<void> => {
	fastify.get<{ Params: PongHistoryParams }>(
		'/api/pong/history/:user',
		{
			schema: {
				params: PongHistoryParams,
				response: PongHistoryResponse,
				operationId: 'pongHistory',
			},
			config: { requireAuth: true },
		},
		async function(req, res) {
			if (req.params.user === 'me') { req.params.user = req.authUser!.id; }
			const user = this.db.getUser(req.params.user);
			if (isNullish(user)) { return res.makeResponse(404, 'failure', 'ponghistory.failure.notfound'); }
			const data = this.db.getAllPongGameForUser(req.params.user as UserId);
			if (isNullish(data)) { return res.makeResponse(404, 'failure', 'ponghistory.failure.notfound'); }

			return res.makeResponse(200, 'success', 'ponghistory.success', {
				data: data.map(v => ({
					gameId: v.id,
					left: { score: v.left.score, id: v.left.id, name: v.nameL },
					right: { score: v.right.score, id: v.right.id, name: v.nameR },
					local: v.local,
					date: v.time.toString(),
					outcome: v.outcome,
				})),
			});
		},
	);
};
export default route;
