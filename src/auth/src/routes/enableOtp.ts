import { FastifyPluginAsync } from 'fastify';

import { Static, Type } from '@sinclair/typebox';
import { isNullish, makeResponse, typeResponse } from '@shared/utils';
import { Otp } from '@shared/auth';


export const WhoAmIRes = Type.Union([
	typeResponse('success', 'enableOtp.success', { url: Type.String({ description: 'The otp url to feed into a 2fa app' }) }),
	typeResponse('failure', ['enableOtp.failure.noUser', 'enableOtp.failure.noSecret']),
]);

export type WhoAmIRes = Static<typeof WhoAmIRes>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.put(
		'/api/auth/enableOtp',
		{ schema: { response: { '2xx': WhoAmIRes } }, config: { requireAuth: true } },
		async function(req, _res) {
			void _res;
			if (isNullish(req.authUser)) {return makeResponse('failure', 'enableOtp.failure.noUser');}
			const otpSecret = this.db.ensureUserOtpSecret(req.authUser!.id);
			if (isNullish(otpSecret)) {return makeResponse('failure', 'enableOtp.failure.noSecret');}
			const otp = new Otp({ secret: otpSecret });
			return makeResponse('success', 'enableOtp.success', { url: otp.totpURL });
		},
	);
};

export default route;
