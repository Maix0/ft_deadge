import { FastifyPluginAsync } from 'fastify';

import { Static, Type } from 'typebox';
import { typeResponse, isNullish, MakeStaticResponse } from '@shared/utils';
import { verifyUserPassword } from '@shared/database/mixin/user';

export const LoginReq = Type.Object({
	name: Type.String(),
	password: Type.String(),
});

export type LoginReq = Static<typeof LoginReq>;

export const LoginRes = {
	'400': typeResponse('failed', ['login.failed.generic', 'login.failed.invalid']),
	'200': typeResponse('success', 'login.success', { token: Type.String({ description: 'JWT that represent a logged in user' }) }),
	'202': typeResponse('otpRequired', 'login.otpRequired', {
		token: Type.String({ description: 'JWT to send with the OTP to finish login' }),
	}),
};

export type LoginRes = MakeStaticResponse<typeof LoginRes>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.post<{ Body: LoginReq; Response: LoginRes }>(
		'/api/auth/login',
		{ schema: { body: LoginReq, response: LoginRes, operationId: 'login' } },
		async function(req, res) {
			try {
				const { name, password } = req.body;
				const user = this.db.getUserFromLoginName(name);

				// does the user exist
				// does it have a password setup ?
				if (isNullish(user?.password)) { return res.makeResponse(403, 'failed', 'login.failed.invalid'); }

				// does the password he provided match the one we have
				if (!(await verifyUserPassword(user, password))) { return res.makeResponse(403, 'failed', 'login.failed.invalid'); }

				// does the user has 2FA up ?
				if (!isNullish(user.otp)) {
					// yes -> we ask them to fill it,
					// send them somehting to verify that they indeed passed throught the user+password phase
					return res.makeResponse(200, 'otpRequired', 'login.otpRequired', { token: this.signJwt('otp', user.id) });
				}

				// every check has been passed, they are now logged in, using this token to say who they are...
				return res.makeResponse(200, 'success', 'login.success', { token: this.signJwt('auth', user.id) });
			}
			catch {
				return res.makeResponse(500, 'failed', 'login.failed.generic');
			}
		},
	);
};

export default route;
