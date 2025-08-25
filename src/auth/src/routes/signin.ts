import { FastifyPluginAsync } from "fastify";

import { Static, Type } from "@sinclair/typebox";

const USERNAME_CHECK: RegExp = /^[a-zA-Z\_0-9]+$/;

export const SignInReq = Type.Object({
	name: Type.String(),
	password: Type.String({ minLength: 8, maxLength: 32 }),
});

export type SignInReq = Static<typeof SignInReq>;

export const SignInRes = Type.Union([
	Type.Object({
		kind: Type.Const("failed"),
		msg_key: Type.Union([
			Type.Const("signin.failed.generic"),
			Type.Const("signin.failed.username.existing"),
			Type.Const("signin.failed.username.toolong"),
			Type.Const("signin.failed.username.tooshort"),
			Type.Const("signin.failed.username.invalid"),
			Type.Const("signin.failed.password.toolong"),
			Type.Const("signin.failed.password.tooshort"),
			Type.Const("signin.failed.password.invalid"),
		]),
	}),
	Type.Object({
		kind: Type.Const("sucess"),
		msg_key: Type.Const("signin.sucess"),
		token: Type.String({ description: "The JWT token" }),
	}),
]);

export type SignInRes = Static<typeof SignInRes>;

const route: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	fastify.post<{ Body: SignInReq; Response: SignInRes }>(
		"/signin",
		{ schema: { body: SignInReq, response: { "2xx": SignInRes } } },
		async function(req, res) {
			const { name, password } = req.body;

			if (name.length < 4)
				return {
					kind: "failed",
					msg_key: "signin.failed.username.tooshort",
				};
			if (name.length > 32)
				return {
					kind: "failed",
					msg_key: "signin.failed.username.toolong",
				};
			if (!USERNAME_CHECK.test(name))
				return {
					kind: "failed",
					msg_key: "signin.failed.username.invalid",
				};
			// username if good now :)

			if (password.length < 8)
				return {
					kind: "failed",
					msg_key: "signin.failed.password.tooshort",
				};
			if (password.length > 64)
				return {
					kind: "failed",
					msg_key: "signin.failed.password.toolong",
				};
			// password is good too !

			if (this.db.getUserFromName(name) !== null)
				return {
					kind: "failed",
					msg_key: "signin.failed.username.existing",
				};
			let u = await this.db.createUser(name, password);
			if (u === null)
				return { kind: "failed", msg_key: "signin.failed.generic" };

			// every check has been passed, they are now logged in, using this token to say who they are...
			let userToken = this.jwt.sign({
				kind: "auth",
				user: u.name,
				createAt: Date.now() / 1000,
			});
			let out = {
				kind: "success",
				msg_key: "login.success",
				token: userToken,
			};
			console.log(out)
			return out;
		},
	);
};

export default route;
