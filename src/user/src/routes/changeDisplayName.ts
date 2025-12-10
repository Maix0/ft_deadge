import { FastifyPluginAsync } from 'fastify';

import { Static, Type } from 'typebox';
import { isNullish, MakeStaticResponse, typeResponse } from '@shared/utils';


export const ChangeDisplayNameRes = {
	'200': typeResponse('success', 'changeDisplayName.success'),
	'400': typeResponse('failure', ['changeDisplayName.alreadyExist', 'changeDisplayName.invalid']),
};

export type ChangeDisplayNameRes = MakeStaticResponse<typeof ChangeDisplayNameRes>;

export const ChangeDisplayNameReq = Type.Object({ name: Type.String({ description: 'New Display Name' }) });
type ChangeDisplayNameReq = Static<typeof ChangeDisplayNameReq>;

const USERNAME_CHECK: RegExp = /^[a-zA-Z_0-9]+$/;
const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.put<{ Body: ChangeDisplayNameReq }>(
		'/api/user/changeDisplayName',
		{ schema: { body: ChangeDisplayNameReq, response: ChangeDisplayNameRes, operationId: 'changeDisplayName' }, config: { requireAuth: true } },
		async function(req, res) {
			if (isNullish(req.authUser)) return;
			if (isNullish(req.body.name)) {
				return res.makeResponse(400, 'failure', 'changeDisplayName.invalid');
			}
			if (req.body.name.length < 4 || req.body.name.length > 32) {
				return res.makeResponse(400, 'failure', 'changeDisplayName.invalid');
			}
			if (!USERNAME_CHECK.test(req.body.name)) {
				return res.makeResponse(400, 'failure', 'changeDisplayName.invalid');
			}
			if (this.db.updateDisplayName(req.authUser.id, req.body.name)) {
				return res.makeResponse(200, 'success', 'changeDisplayName.success');
			}
			else {
				return res.makeResponse(400, 'failure', 'changeDisplayName.alreadyExist');
			}
		},
	);
};

export default route;
