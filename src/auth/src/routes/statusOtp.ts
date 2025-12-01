import { FastifyPluginAsync } from 'fastify';

import { Type } from 'typebox';
import { isNullish, MakeStaticResponse, typeResponse } from '@shared/utils';

export const StatusOtpRes = {
	200: Type.Union([
		typeResponse('success', 'statusOtp.success.enabled', {
			secret: Type.String({ description: 'The otp secret' }),
		}),
		typeResponse('success', 'statusOtp.success.disabled'),
	]),
	500: typeResponse('failure', 'statusOtp.failure.generic'),
};

export type StatusOtpRes = MakeStaticResponse<typeof StatusOtpRes>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.get(
		'/api/auth/statusOtp',
		{
			schema: { response: StatusOtpRes, operationId: 'statusOtp' },
			config: { requireAuth: true },
		},
		async function(req, res) {
			if (isNullish(req.authUser)) {
				return res.makeResponse(
					500,
					'failure',
					'statusOtp.failure.generic',
				);
			}
			const otpSecret = this.db.getUserOtpSecret(req.authUser.id);
			if (isNullish(otpSecret)) {
				return res.makeResponse(
					200,
					'success',
					'statusOtp.success.disabled',
				);
			}
			return res.makeResponse(
				200,
				'success',
				'statusOtp.success.enabled',
				{ secret: otpSecret },
			);
		},
	);
};

export default route;
