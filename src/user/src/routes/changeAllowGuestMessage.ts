import { FastifyPluginAsync } from 'fastify';

import { isNullish, MakeStaticResponse, typeResponse } from '@shared/utils';


export const GuestMessageRes = {
	'200': typeResponse('success', 'guestMessage.success'),
	'403': typeResponse('failure', 'guestMessage.failure.notLoggedIn'),
};

export type GuestMessageRes = MakeStaticResponse<typeof GuestMessageRes>;

const allowRoute: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.post(
		'/api/user/allowGuestMessage',
		{ schema: { response: GuestMessageRes, operationId: 'allowGuestMessage' }, config: { requireAuth: true } },
		async function(req, res) {
			if (isNullish(req.authUser)) { return res.makeResponse(403, 'failure', 'guestMessage.failure.notLoggedIn'); }

			this.db.allowGuestMessage(req.authUser.id);
			return res.makeResponse(200, 'success', 'guestMessage.success');
		},
	);
};

const denyRoute: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.post(
		'/api/user/denyGuestMessage',
		{ schema: { response: GuestMessageRes, operationId: 'denyGuestMessage' }, config: { requireAuth: true } },
		async function(req, res) {
			if (isNullish(req.authUser)) { return res.makeResponse(403, 'failure', 'guestMessage.failure.notLoggedIn'); }

			this.db.denyGuestMessage(req.authUser.id);
			return res.makeResponse(200, 'success', 'guestMessage.success');
		},
	);
};


const route: FastifyPluginAsync = async (fastify): Promise<void> => {
	fastify.register(allowRoute);
	fastify.register(denyRoute);
};

export default route;
