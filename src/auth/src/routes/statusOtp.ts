import { FastifyPluginAsync } from "fastify";

import { Static, Type } from "@sinclair/typebox";
import { isNullish, makeResponse, typeResponse } from "@shared/utils"
import { Otp } from "@shared/auth";


export const StatusOtpRes = Type.Union([
	typeResponse("success", "statusOtp.success.enabled", { url: Type.String({ description: "The otp url to feed into a 2fa app" }) }),
	typeResponse("success", "statusOtp.success.disabled"),
	typeResponse("failure", "statusOtp.failure.generic")
]);

export type StatusOtpRes = Static<typeof StatusOtpRes>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	fastify.get(
		"/api/auth/statusOtp",
		{ schema: { response: { "2xx": StatusOtpRes } }, config: { requireAuth: true } },
		async function(req, _res) {
			if (isNullish(req.authUser))
				return makeResponse("failure", "statusOtp.failure.generic");
			let otpSecret = this.db.getUserOtpSecret(req.authUser.id);
			if (isNullish(otpSecret))
				return makeResponse("success", "statusOtp.success.disabled");
			let otp = new Otp({ secret: otpSecret })
			return makeResponse("success", "statusOtp.success.enabled", { url: otp.totpURL });
		},
	);
};

export default route;
