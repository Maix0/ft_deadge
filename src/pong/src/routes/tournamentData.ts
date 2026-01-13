import { TournamentId } from '@shared/database/mixin/tournament';
import { isNullish, MakeStaticResponse, typeResponse } from '@shared/utils';
import { FastifyPluginAsync } from 'fastify';
import { Static, Type } from 'typebox';

const TournamentDataParams = Type.Object({
	id: Type.String({ description: 'the tournament id' }),
});

type TournamentDataParams = Static<typeof TournamentDataParams>;
const TournamentDataResponse = {
	'200': typeResponse('success', 'tournamentData.success', {
		data: Type.Object({
			playerCount: Type.Number(),
			owner: Type.String({ description: 'ownerId' }),
			users: Type.Array(
				Type.Object({
					score: Type.Integer(),
					id: Type.String(),
					nickname: Type.String(),
				}),
			),
			games: Type.Array(
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
			time: Type.String(),
		}),
	}),
	'404': typeResponse('failure', 'tournamentData.failure.notFound'),
};
type TournamentDataResponse = MakeStaticResponse<typeof TournamentDataResponse>;

const route: FastifyPluginAsync = async (fastify): Promise<void> => {
	fastify.get<{ Params: TournamentDataParams }>(
		'/api/pong/tournament/:id',
		{
			schema: {
				params: TournamentDataParams,
				response: TournamentDataResponse,
				operationId: 'TournamentData',
			},
			config: { requireAuth: true },
		},
		async function(req, res) {
			const tourId = req.params.id;
			const data = this.db.getTournamentById(tourId as TournamentId);
			if (isNullish(data)) {
				return res.makeResponse(
					404,
					'failure',
					'tournamentData.failure.notFound',
				);
			}
			console.log(data);
			const typed_res: TournamentDataResponse['200']['payload']['data'] =
			{
				playerCount: data.playerCount,
				owner: data.owner,
				time: data.time,
				users: data.users.map((v) => ({
					nickname: v.nickname,
					score: v.score,
					id: v.user,
				})),
				games: data.games.map((v) => ({
					gameId: v.id,
					left: {
						score: v.left.score,
						id: v.left.id,
						name: `${v.nameL}`,
					},
					right: {
						score: v.right.score,
						id: v.right.id,
						name: `${v.nameR}`,
					},
					local: v.local,
					date: v.time.toString(),
					outcome: v.outcome,
				})),
			};
			return res.makeResponse(200, 'success', 'tournamentData.success', {
				data: typed_res,
			});
		},
	);
};
export default route;
