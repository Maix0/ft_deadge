import { FastifyPluginAsync } from "fastify";

import { Static, Type } from "@sinclair/typebox";
import { JwtType, Otp } from "@shared/auth";

export const OtpReq = Type.Object({
	token: Type.String({ description: "The token given at the login phase" }),
	code: Type.String({ description: "The OTP given by the user" }),
});

export type OtpReq = Static<typeof OtpReq>;

export const OtpRes = Type.Union([
	Type.Object({
		kind: Type.Const("failed"),
		msg_key: Type.Union([
			Type.Const("otp.failed.generic"),
			Type.Const("otp.failed.invalid"),
			Type.Const("otp.failed.timeout"),
		]),
	}),
	Type.Object({
		kind: Type.Const("success"),
		msg_key: Type.Const("otp.success"),
		token: Type.String({ description: "The JWT token" }),
	}),
]);

export type OtpRes = Static<typeof OtpRes>;

const OTP_TOKEN_TIMEOUT_SEC = 120;

const route: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	fastify.get<{ Body: OtpReq }>(
		"/whoami",
		{ schema: { body: OtpReq, response: { "2xx": OtpRes } } },
		async function(req, res) {
			try {
				const { token, code } = req.body;
				// lets try to decode+verify the jwt
				let dJwt = this.jwt.verify<JwtType>(token);

				// is the jwt a valid `otp` jwt ?
				if (dJwt.kind != "otp")
					// no ? fuck off then
					return { kind: "failed", msg_key: "otp.failed.invalid" };
				// is it too old ?
				if (dJwt.createdAt + OTP_TOKEN_TIMEOUT_SEC * 1000 > Date.now())
					// yes ? fuck off then, redo the password
					return { kind: "failed", msg_key: "otp.failed.timeout" };

				// get the Otp sercret from the db
				let otpSecret = this.db.getUserFromName(dJwt.who)?.otp;
				if (otpSecret === null)
					// oops, either no user, or user without otpSecret
					// fuck off
					return { kind: "failed", msg_key: "otp.failed.invalid" };

				// good lets now verify the token you gave us is the correct one...
				let otpHandle = new Otp({ secret: otpSecret });

				let now = Date.now();
				const tokens = [
					// we also get the last code, to mitiage the delay between client<->server roundtrip...
					otpHandle.totp(now - 30 * 1000),
					// this is the current token :)
					otpHandle.totp(now),
				];

				// checking if any of the array match
				if (tokens.some((c) => c === code))
					// they do !
					// gg you are now logged in !
					return {
						kind: "success",
						msg_key: "otp.success",
						token: this.signJwt("auth", dJwt.who),
					};
			} catch {
				return { kind: "failed", msg_key: "otp.failed.generic" };
			}
		},
	);
};

export default route;
