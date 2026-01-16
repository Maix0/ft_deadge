import { FastifyPluginAsync } from 'fastify';
import { MakeStaticResponse, typeResponse } from '@shared/utils';
import Type, { Static } from 'typebox';

export const AddFriendRes = {
	'200': typeResponse('success', 'addFriend.success'),
	'404': typeResponse('failure', 'addFriend.failure.unknownUser'),
};

export type AddFriendRes = MakeStaticResponse<typeof AddFriendRes>;

const AddFriendParams = Type.Object({
	user: Type.String(),
});
export type AddFriendParams = Static<typeof AddFriendParams>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.put<{ Params: AddFriendParams }>(
		'/api/user/friend/add/:user',
		{
			schema: {
				params: AddFriendParams,
				response: AddFriendRes,
				operationId: 'addFriend',
			},
			config: { requireAuth: true },
		},
		async function(req, res) {
			const friend = this.db.getUser(req.params.user);
			if (!friend) {
				return res.makeResponse(
					404,
					'failure',
					'addFriend.failure.unknownUser',
				);
			}
			this.db.addFriendsUserFor(req.authUser!.id, friend.id);
			return res.makeResponse(200, 'success', 'addFriend.success');
		},
	);
};

export default route;
