import { FastifyPluginAsync } from 'fastify';

import { Static, Type } from 'typebox';
import { isNullish, MakeStaticResponse, typeResponse } from '@shared/utils';


export const ChangeDescRes = {
	'200': typeResponse('success', 'changedesc.success'),
	'400': typeResponse('failure', 'changedesc.failure.descTooLong'),
	'403': typeResponse('failure', 'changedesc.failure.notLoggedIn'),
};

export type ChangeDescRes = MakeStaticResponse<typeof ChangeDescRes>;

export const ChangeDescBody = Type.Object({ desc: Type.String() });
export type ChangeDescBody = Static<typeof ChangeDescBody>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.post<{ Body: ChangeDescBody }>(
		'/api/user/changeDesc',
		{ schema: { body: ChangeDescBody, response: ChangeDescRes, operationId: 'changeDesc' }, config: { requireAuth: true } },
		async function(req, res) {
			if (isNullish(req.authUser)) { return res.makeResponse(403, 'failure', 'changedesc.failure.notLoggedIn'); }

			if (req.body.desc.length > 75) {
				return res.makeResponse(400, 'failure', 'changedesc.failure.descTooLong');
			}

			this.db.setUserDescription(req.authUser.id, req.body.desc);
			return res.makeResponse(200, 'success', 'changedesc.success');
		},
	);
};

export default route;
