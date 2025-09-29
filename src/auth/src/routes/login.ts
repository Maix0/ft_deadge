import { FastifyPluginAsync } from 'fastify';

import { Static, Type } from '@sinclair/typebox';
import { typeResponse, makeResponse, isNullish } from '@shared/utils';
import { verifyUserPassword } from '@shared/database/mixin/user';

export const LoginReq = Type.Object({
	name: Type.String(),
	password: Type.String(),
});

export type LoginReq = Static<typeof LoginReq>;

export const LoginRes = Type.Union([
	typeResponse('failed', ['login.failed.generic', 'login.failed.invalid']),
	typeResponse('otpRequired', 'login.otpRequired', { token: Type.String({ description: 'JWT to send with the OTP to finish login' }) }),
	typeResponse('success', 'login.success', { token: Type.String({ description: 'JWT that represent a logged in user' }) }),
]);


export type LoginRes = Static<typeof LoginRes>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.post<{ Body: LoginReq; Response: LoginRes }>(
		'/api/auth/login',
		{ schema: { body: LoginReq, response: { '2xx': LoginRes } } },
		async function(req, _res) {
			void _res;
			try {
				const { name, password } = req.body;
				const user = this.db.getUserFromName(name);

				// does the user exist
				// does it have a password setup ?
				if (isNullish(user?.password)) {return makeResponse('failed', 'login.failed.invalid');}

				// does the password he provided match the one we have
				if (!(await verifyUserPassword(user, password))) {return makeResponse('failed', 'login.failed.invalid');}

				// does the user has 2FA up ?
				if (!isNullish(user.otp)) {
					// yes -> we ask them to fill it,
					// send them somehting to verify that they indeed passed throught the user+password phase
					return makeResponse('otpRequired', 'login.otpRequired', { token: this.signJwt('otp', user.name) });
				}

				// every check has been passed, they are now logged in, using this token to say who they are...
				return makeResponse('success', 'login.success', { token: this.signJwt('auth', user.name) });
			}
			catch {
				return makeResponse('failed', 'login.failed.generic');
			}
		},
	);
};

export default route;
