import { FastifyPluginAsync } from "fastify";

import { Static, Type } from "@sinclair/typebox";
import { user as userDb } from "@shared/database";
import type { } from "@shared/auth";

export const LoginReq = Type.Object({
	name: Type.String(),
	password: Type.String({ minLength: 8, maxLength: 32 }),
});

export type LoginReq = Static<typeof LoginReq>;


export const LoginRes = Type.Union([
	Type.Object({
		kind: Type.Const("failed"),
		msg_key: Type.Union([
			Type.Const("login.failed.generic"),
			Type.Const("login.failed.invalid"),
		]),
	}),
	Type.Object({
		kind: Type.Const("otpRequired"),
		msg_key: Type.Const("login.otpRequired"),
		token: Type.String({
			description: "Code to send with the OTP to finish login",
		}),
	}),
	Type.Object({
		kind: Type.Const("success"),
		msg_key: Type.Const("login.success"),
		token: Type.String({ description: "The JWT token" }),
	}),
]);

export type LoginRes = Static<typeof LoginRes>;

const route: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	fastify.post<{ Body: LoginReq; Response: LoginRes }>(
		"/login",
		{
			schema: {
				body: LoginReq,
				response: { "2xx": LoginRes },
			},
		},
		async function(req, res) {
			try {
				let { name, password } = req.body;
				let user = this.db.getUserFromName(name);

				// does the user exist
				// does it have a password setup ?
				if (user === null || user.password === null)
					return { kind: "failed", msg_key: "login.failed.invalid" };

				// does the password he provided match the one we have
				if (!(await userDb.verifyUserPassword(user, password)))
					return { kind: "failed", msg_key: "login.failed.invalid" };

				// does the user has 2FA up ?
				if (user.otp !== null) {
					// yes -> we ask them to fill it,
					// send them somehting to verify that they indeed passed throught the user+password phase
					let otpToken = this.jwt.sign({ kind: "otp", user: user.name, createAt: Date.now() / 1000 });
					return { kind: "otpRequired", msg_key: "login.otpRequired", token: otpToken };
				}

				// every check has been passed, they are now logged in, using this token to say who they are...
				let userToken = this.jwt.sign({ kind: "auth", user: user.name, createAt: Date.now() / 1000 });
				return { kind: "success", msg_key: "login.success", token: userToken }
			}
			catch {
				return { kind: "failed", msg_key: "login.failed.generic" };
			}
		},
	);
};

export default route;
