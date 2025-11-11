// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   otp.ts                                             :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: maiboyer <maiboyer@student.42.fr>          +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/11/07 16:25:58 by maiboyer          #+#    #+#             //
//   Updated: 2025/11/09 00:44:33 by maiboyer         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import { FastifyPluginAsync } from 'fastify';

import { Static, Type } from 'typebox';
import { JwtType, Otp } from '@shared/auth';
import { typeResponse, MakeStaticResponse, isNullish } from '@shared/utils';

const OtpReq = Type.Object({
	token: Type.String({ description: 'The token given at the login phase' }),
	code: Type.String({ description: 'The OTP given by the user' }),
});

type OtpReq = Static<typeof OtpReq>;

const OtpRes = {
	'500': typeResponse('failed', 'otp.failed.generic'),
	'400': typeResponse('failed', 'otp.failed.invalid'),
	'401': typeResponse('failed', 'otp.failed.noSecret'),
	'408': typeResponse('failed', 'otp.failed.timeout'),
	'200': typeResponse('success', 'otp.success', { token: Type.String({ description: 'the JWT Token' }) }),
};

type OtpRes = MakeStaticResponse<typeof OtpRes>;

const OTP_TOKEN_TIMEOUT_SEC = 120;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.post<{ Body: OtpReq }>(
		'/api/auth/otp',
		{ schema: { body: OtpReq, response: OtpRes, operationId: 'loginOtp' } },
		async function(req, res) {
			try {
				const { token, code } = req.body;
				// lets try to decode+verify the jwt
				const dJwt = this.jwt.verify<JwtType>(token);

				// is the jwt a valid `otp` jwt ?
				if (dJwt.kind != 'otp') {
					// no ? fuck off then
					return res.makeResponse(400, 'failed', 'otp.failed.invalid');
				}
				// is it too old ?
				if (dJwt.createdAt + OTP_TOKEN_TIMEOUT_SEC * 1000 < Date.now()) {
					// yes ? fuck off then, redo the password
					return res.makeResponse(408, 'failed', 'otp.failed.timeout');
				}

				// get the Otp sercret from the db
				const user = this.db.getUser(dJwt.who);
				if (isNullish(user?.otp)) {
					// oops, either no user, or user without otpSecret
					// fuck off
					return res.makeResponse(401, 'failed', 'otp.failed.noSecret');
				}

				// good lets now verify the token you gave us is the correct one...
				const otpHandle = new Otp({ secret: user.otp });

				const now = Date.now();
				const tokens = [
					// we also get the last code, to mitiage the delay between client<->server roundtrip...
					otpHandle.totp(now - 30 * 1000),
					// this is the current token :)
					otpHandle.totp(now),
				];

				// checking if any of the array match
				if (tokens.some((c) => c === code)) {
					// they do !
					// gg you are now logged in !
					return res.makeResponse(200, 'success', 'otp.success', { token: this.signJwt('auth', dJwt.who) });
				}
			}
			catch {
				return res.makeResponse(500, 'failed', 'otp.failed.generic');
			}
			return res.makeResponse(500, 'failed', 'otp.failed.generic');
		},
	);
};

export default route;
