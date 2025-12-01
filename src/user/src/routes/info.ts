import { FastifyPluginAsync } from 'fastify';

import { Static, Type } from 'typebox';
import { isNullish, MakeStaticResponse, typeResponse } from '@shared/utils';


export const UserInfoRes = {
	'200': typeResponse('success', 'userinfo.success', {
		name: Type.String(), id: Type.String(), guest: Type.Boolean(),
		selfInfo: Type.Optional(Type.Object({
			login_name: Type.Optional(Type.String()),
			provider_id: Type.Optional(Type.String()),
			provider_user: Type.Optional(Type.String()),
		})),
	}),
	'403': typeResponse('failure', 'userinfo.failure.notLoggedIn'),
	'404': typeResponse('failure', 'userinfo.failure.unknownUser'),
};

export type UserInfoRes = MakeStaticResponse<typeof UserInfoRes>;

export const UserInfoParams = Type.Object({
	user: Type.Union([
		Type.Enum(['me'], { description: 'the current logged in user' }),
		Type.String({ format: 'uuid', description: 'A user uuid' }),
	]),
});

export type UserInfoParams = Static<typeof UserInfoParams>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.get<{ Params: UserInfoParams }>(
		'/api/user/info/:user',
		{ schema: { params: UserInfoParams, response: UserInfoRes, operationId: 'getUser' }, config: { requireAuth: true } },
		async function(req, res) {
			if (isNullish(req.authUser)) { return res.makeResponse(403, 'failure', 'userinfo.failure.notLoggedIn'); }
			if (isNullish(req.params.user) || req.params.user.length === 0) {
				return res.makeResponse(404, 'failure', 'userinfo.failure.unknownUser');
			}

			// if the param is the special value `me`, then just get the id from the currently auth'ed user
			if (req.params.user === 'me') {
				req.params.user = req.authUser.id;
			}
			const askSelf = req.params.user === req.authUser.id;

			const user = this.db.getUser(req.params.user);
			if (isNullish(user)) {
				return res.makeResponse(404, 'failure', 'userinfo.failure.unknownUser');
			}


			const payload = {
				name: user.name,
				id: user.id,
				// the !! converts a value from <something> to either `true` or `false`
				// it uses the same convention from using <something> in a if, meaning that
				// ```
				// let val;
				// if (something) { val = true; }
				// else { val = false; }
				// ```
				// is the same as `val = !!something`
				guest: !!user.guest,
				selfInfo: askSelf ? {
					login_name: user.login,
					provider_id: user.provider_name,
					provider_user: user.provider_unique,
				} : null,
			};

			return res.makeResponse(200, 'success', 'userinfo.success', payload);
		},
	);
};

export default route;
