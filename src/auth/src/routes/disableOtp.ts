import { FastifyPluginAsync } from 'fastify';

import { Static, Type } from '@sinclair/typebox';
import { makeResponse, typeResponse, isNullish } from '@shared/utils';


export const WhoAmIRes = Type.Union([
	typeResponse('success', 'disableOtp.success'),
	typeResponse('failure', 'disableOtp.failure.generic'),
]);

export type WhoAmIRes = Static<typeof WhoAmIRes>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.put(
		'/api/auth/disableOtp',
		{ schema: { response: { '2xx': WhoAmIRes } }, config: { requireAuth: true } },
		async function(req, _res) {
			void _res;
			if (isNullish(req.authUser)) {return makeResponse('failure', 'disableOtp.failure.generic');}
			this.db.deleteUserOtpSecret(req.authUser.id);
			return makeResponse('success', 'disableOtp.success');
		},
	);
};

export default route;
