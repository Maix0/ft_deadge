import { FastifyPluginAsync } from 'fastify';
import { isNullish, MakeStaticResponse, typeResponse } from '@shared/utils';
import Type, { Static } from 'typebox';

export const ListFriendRes = {
	'200': typeResponse('success', 'listFriend.success', {
		friends: Type.Array(Type.Object({
			id: Type.String(),
			name: Type.String(),
		})),
	}),
};

export type ListFriendRes = MakeStaticResponse<typeof ListFriendRes>;

const RemoveFriendParams = Type.Object({
	user: Type.String(),
});
export type RemoveFriendParams = Static<typeof RemoveFriendParams>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.get(
		'/api/user/friend/list',
		{
			schema: {
				response: ListFriendRes,
				operationId: 'listFriend',
			},
			config: { requireAuth: true },
		},
		async function(req, res) {
			void req;
			const friends: ListFriendRes['200']['payload']['friends'] = this.db.getFriendsUserFor(req.authUser!.id).map(v => this.db.getUser(v.friend)).filter(v => !isNullish(v)).map(v => ({ id: v.id, name: v.name }));
			return res.makeResponse(200, 'success', 'listFriend.success', { friends });
		},
	);
};

export default route;
