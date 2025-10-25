import { FastifyPluginAsync } from 'fastify';

import { Static, Type } from '@sinclair/typebox';
import { isNullish, makeResponse, typeResponse } from '@shared/utils';


export const UserInfoRes = Type.Union([
	typeResponse('success', 'userinfo.success', { name: Type.String(), id: Type.String(), guest: Type.Boolean() }),
	typeResponse('failure', ['userinfo.failure.generic', 'userinfo.failure.unknownUser', 'userinfo.failure.notLoggedIn']),
]);

export type UserInfoRes = Static<typeof UserInfoRes>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.get<{ Params: { user: string } }>(
		'/api/user/info/:user',
		{ schema: { response: { '2xx': UserInfoRes } }, config: { requireAuth: true } },
		async function(req, _res) {
			void _res;
			if (isNullish(req.authUser)) { return makeResponse('failure', 'userinfo.failure.notLoggedIn'); }
			if (isNullish(req.params.user) || req.params.user.length === 0) {
				return makeResponse('failure', 'userinfo.failure.unknownUser');
			}

			// if the param is the special value `me`, then just get the id from the currently auth'ed user
			if (req.params.user === 'me') {
				req.params.user = req.authUser.id;
			}

			const user = this.db.getUser(req.params.user);
			if (isNullish(user)) {
				return makeResponse('failure', 'userinfo.failure.unknownUser');
			}


			const payload = {
				name: user.display_name,
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
			};

			return makeResponse('success', 'userinfo.success', payload);
		},
	);
};

export default route;
