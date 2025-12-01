import { FastifyPluginAsync } from 'fastify';

// import { Static, Type } from 'typebox';
import { typeResponse, isNullish } from '@shared/utils';


export const DisableOtpRes = {
	'200': typeResponse('success', 'disableOtp.success'),
	'500': typeResponse('failure', 'disableOtp.failure.generic'),
	'400': typeResponse('failure', 'disableOtp.failure.guest'),
};


const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.put(
		'/api/auth/disableOtp',
		{ schema: { response: DisableOtpRes, operationId: 'disableOtp' }, config: { requireAuth: true } },
		async function(req, res) {
			void res;
			if (isNullish(req.authUser)) { return res.makeResponse(500, 'failure', 'disableOtp.failure.generic'); }
			if (req.authUser.guest) {
				return res.makeResponse(
					400,
					'failure',
					'disableOtp.failure.guest',
				);
			}
			this.db.deleteUserOtpSecret(req.authUser.id);
			return res.makeResponse(200, 'success', 'disableOtp.success');
		},
	);
};

export default route;
