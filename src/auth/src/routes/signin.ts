import { FastifyPluginAsync } from "fastify";

import { Static, Type } from "@sinclair/typebox";
import { typeResponse, makeResponse, isNullish } from "@shared/utils";

const USERNAME_CHECK: RegExp = /^[a-zA-Z\_0-9]+$/;

const SignInReq = Type.Object({
	name: Type.String(),
	password: Type.String(),
});

type SignInReq = Static<typeof SignInReq>;

const SignInRes = Type.Union([
	typeResponse("failed", [
		"signin.failed.generic",
		"signin.failed.username.existing",
		"signin.failed.username.toolong",
		"signin.failed.username.tooshort",
		"signin.failed.username.invalid",
		"signin.failed.password.toolong",
		"signin.failed.password.tooshort",
		"signin.failed.password.invalid",
	]),
	typeResponse("success", "signin.success", { token: Type.String({ description: "the JWT token" }) }),
])

type SignInRes = Static<typeof SignInRes>;

const route: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	fastify.post<{ Body: SignInReq }>(
		"/api/auth/signin",
		{ schema: { body: SignInReq, response: { "200": SignInRes, "5xx": Type.Object({}) } }, },
		async function(req, res) {
			const { name, password } = req.body;

			if (name.length < 4)
				return makeResponse("failed", "signin.failed.username.tooshort");
			if (name.length > 32)
				return makeResponse("failed", "signin.failed.username.toolong");
			if (!USERNAME_CHECK.test(name))
				return makeResponse("failed", "signin.failed.username.invalid");
			// username if good now :)

			if (password.length < 8)
				return makeResponse("failed", "signin.failed.password.tooshort");
			if (password.length > 64)
				return makeResponse("failed", "signin.failed.password.toolong");
			// password is good too !

			if (this.db.getUserFromName(name) !== undefined)
				return makeResponse("failed", "signin.failed.username.existing");
			let u = await this.db.createUser(name, password);
			if (isNullish(u))
				return makeResponse("failed", "signin.failed.generic");

			// every check has been passed, they are now logged in, using this token to say who they are...
			let userToken = this.signJwt('auth', u.name);
			return makeResponse("success", "signin.success", { token: userToken });
		},
	);
};

export default route;
