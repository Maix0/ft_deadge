import { FastifyPluginAsync } from 'fastify';

import { Type } from 'typebox';
import { isNullish, MakeStaticResponse, typeResponse } from '@shared/utils';
import { Otp } from '@shared/auth';


export const EnableOtpRes = {
	'200': typeResponse('success', 'enableOtp.success', {
		url: Type.String({ description: 'The otp url to feed into a 2fa app' }),
	}),
	'401': typeResponse('failure', ['enableOtp.failure.noUser', 'enableOtp.failure.noSecret']),
	'400': typeResponse('failure', ['enableOtp.failure.guest']),
};

export type EnableOtpRes = MakeStaticResponse<typeof EnableOtpRes>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.put<{ Reply: EnableOtpRes }>(
		'/api/auth/enableOtp',
		{ schema: { response: EnableOtpRes, operationId: 'enableOtp' }, config: { requireAuth: true } },
		async function(req, res) {
			if (isNullish(req.authUser)) { return res.makeResponse(403, 'failure', 'enableOtp.failure.noUser'); }
			if (req.authUser.guest) {
				return res.makeResponse(
					400,
					'failure',
					'enableOtp.failure.guest',
				);
			}

			const otpSecret = this.db.ensureUserOtpSecret(req.authUser!.id);
			if (isNullish(otpSecret)) { return res.makeResponse(403, 'failure', 'enableOtp.failure.noSecret'); }

			const otp = new Otp({ secret: otpSecret });

			return res.makeResponse(200, 'success', 'enableOtp.success', { url: otp.totpURL });
		},
	);
};

export default route;
