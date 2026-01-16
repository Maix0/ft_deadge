import { FastifyPluginAsync } from 'fastify';
import { MakeStaticResponse, typeResponse } from '@shared/utils';
import Type, { Static } from 'typebox';

export const RemoveFriendRes = {
	'200': typeResponse('success', 'removeFriend.success'),
	'404': typeResponse('failure', 'removeFriend.failure.unknownUser'),
};

export type RemoveFriendRes = MakeStaticResponse<typeof RemoveFriendRes>;

const RemoveFriendParams = Type.Object({
	user: Type.String(),
});
export type RemoveFriendParams = Static<typeof RemoveFriendParams>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.put<{ Params: RemoveFriendParams }>(
		'/api/user/friend/remove/:user',
		{
			schema: {
				params: RemoveFriendParams,
				response: RemoveFriendRes,
				operationId: 'removeFriend',
			},
			config: { requireAuth: true },
		},
		async function(req, res) {
			const friend = this.db.getUser(req.params.user);
			if (!friend) {
				return res.makeResponse(
					404,
					'failure',
					'removeFriend.failure.unknownUser',
				);
			}
			this.db.removeFriendsUserFor(req.authUser!.id, friend.id);
			return res.makeResponse(200, 'success', 'removeFriend.success');
		},
	);
};

export default route;
