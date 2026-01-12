import { MakeStaticResponse, typeResponse } from '@shared/utils';
import { FastifyPluginAsync } from 'fastify';
import { Type } from 'typebox';

const TournamentListResponse = {
	'200': typeResponse('success', 'tournamentList.success', {
		data: Type.Array(
			Type.Object({
				id: Type.String({ description: 'tournamentId' }),
				owner: Type.String({ description: 'ownerId' }),
				time: Type.String(),
			}),
		),
	}),
	'404': typeResponse('failure', 'tournamentList.failure.generic'),
};
/*
const TournamentListResponse = {
	'200': typeResponse('success', 'tournamentHistory.success', {
		data: Type.Array(
			Type.Object({
				owner: Type.String({ description: 'ownerId' }),
				users: Type.Array(Type.Object({
					score: Type.Integer(),
					id: Type.String(),
					name: Type.String(),
				})),
				game: Type.Object({
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
				date: Type.String(),
			}),
		),
	}),
	'404': typeResponse('failure', 'tournamentHistory.failure.generic'),
};
*/
type TournamentListResponse = MakeStaticResponse<typeof TournamentListResponse>;

const route: FastifyPluginAsync = async (fastify): Promise<void> => {
	fastify.get(
		'/api/pong/tournament/',
		{
			schema: {
				response: TournamentListResponse,
				operationId: 'TournamentList',
			},
			config: { requireAuth: true },
		},
		async function(req, res) {
			void req;
			const typed_data: TournamentListResponse['200']['payload']['data'] = this.db.getAllTournamentsData();

			return res.makeResponse(200, 'success', 'tournamentHistory.success', { data: typed_data });
		},
	);
};
export default route;
