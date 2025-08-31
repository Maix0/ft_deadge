import { FastifyPluginAsync } from "fastify";

import { Static, Type } from "@sinclair/typebox";
import { JwtType, Otp } from "@shared/auth";
import { typeResponse, makeResponse, isNullish } from "@shared/utils";

const OtpReq = Type.Object({
	token: Type.String({ description: "The token given at the login phase" }),
	code: Type.String({ description: "The OTP given by the user" }),
});

type OtpReq = Static<typeof OtpReq>;

const OtpRes = Type.Union([
	typeResponse("failed", ["otp.failed.generic", "otp.failed.invalid", "otp.failed.timeout", "otp.failed.noSecret"]),
	typeResponse("success", "otp.success", { token: Type.String({ description: "the JWT Token" }) }),
]);

type OtpRes = Static<typeof OtpRes>;

const OTP_TOKEN_TIMEOUT_SEC = 120;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	fastify.post<{ Body: OtpReq }>(
		"/api/auth/otp",
		{ schema: { body: OtpReq, response: { "2xx": OtpRes } } },
		async function(req, _res) {
			try {
				const { token, code } = req.body;
				// lets try to decode+verify the jwt
				let dJwt = this.jwt.verify<JwtType>(token);

				// is the jwt a valid `otp` jwt ?
				if (dJwt.kind != "otp")
					// no ? fuck off then
					return makeResponse("failed", "otp.failed.invalid");
				// is it too old ?
				if (dJwt.createdAt + OTP_TOKEN_TIMEOUT_SEC * 1000 < Date.now())
					// yes ? fuck off then, redo the password
					return makeResponse("failed", "otp.failed.timeout");

				// get the Otp sercret from the db
				let otpSecret = this.db.getUserFromName(dJwt.who)?.otp;
				if (isNullish(otpSecret))
					// oops, either no user, or user without otpSecret
					// fuck off
					return makeResponse("failed", "otp.failed.noSecret");

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
					return makeResponse("success", "otp.success", { token: this.signJwt("auth", dJwt.who) });
			} catch {
				return makeResponse("failed", "otp.failed.generic");
			}
			return makeResponse("failed", "otp.failed.generic");
		},
	);
};

export default route;
