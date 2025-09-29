import { FastifyPluginAsync } from 'fastify';

import { Static, Type } from '@sinclair/typebox';
import { isNullish, makeResponse, typeResponse } from '@shared/utils';


export const WhoAmIRes = Type.Union([
	typeResponse('success', 'whoami.success', { name: Type.String() }),
	typeResponse('failure', 'whoami.failure.generic'),
]);

export type WhoAmIRes = Static<typeof WhoAmIRes>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.get(
		'/api/auth/whoami',
		{ schema: { response: { '2xx': WhoAmIRes } }, config: { requireAuth: true } },
		async function(req, _res) {
			void _res;
			if (isNullish(req.authUser)) {return makeResponse('failure', 'whoami.failure.generic');}
			return makeResponse('success', 'whoami.success', { name: req.authUser.name });
		},
	);
};

export default route;
