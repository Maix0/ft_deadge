import { FastifyPluginAsync } from 'fastify';

import { Static, Type } from 'typebox';
import { typeResponse, isNullish, MakeStaticResponse } from '@shared/utils';

const USERNAME_CHECK: RegExp = /^[a-zA-Z_0-9]+$/;

const SignInReq = Type.Object({
	name: Type.String(),
	password: Type.String(),
});

type SignInReq = Static<typeof SignInReq>;

const SignInRes = {
	'500': typeResponse('failed',
		'signin.failed.generic'),
	'400': typeResponse('failed', [
		'signin.failed.username.existing',
		'signin.failed.username.toolong',
		'signin.failed.username.tooshort',
		'signin.failed.username.invalid',
		'signin.failed.password.toolong',
		'signin.failed.password.tooshort',
		'signin.failed.password.invalid',
	]),
	'200': typeResponse('success', 'signin.success', { token: Type.String({ description: 'the JWT token' }) }),
};

type SignInRes = MakeStaticResponse<typeof SignInRes>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.post<{ Body: SignInReq }>(
		'/api/auth/signin',
		{ schema: { body: SignInReq, response: SignInRes, operationId: 'signin' } },
		async function(req, res) {
			const { name, password } = req.body;

			if (name.length < 4) { return res.makeResponse(400, 'failed', 'signin.failed.username.tooshort'); }
			if (name.length > 32) { return res.makeResponse(400, 'failed', 'signin.failed.username.toolong'); }
			if (!USERNAME_CHECK.test(name)) { return res.makeResponse(400, 'failed', 'signin.failed.username.invalid'); }
			// username if good now :)

			if (password.length < 8) { return res.makeResponse(400, 'failed', 'signin.failed.password.tooshort'); }
			if (password.length > 64) { return res.makeResponse(400, 'failed', 'signin.failed.password.toolong'); }
			// password is good too !

			if (this.db.getUserFromLoginName(name) !== undefined) { return res.makeResponse(400, 'failed', 'signin.failed.username.existing'); }
			const u = await this.db.createUser(name, name, password);
			if (isNullish(u)) { return res.makeResponse(500, 'failed', 'signin.failed.generic'); }

			// every check has been passed, they are now logged in, using this token to say who they are...
			const userToken = this.signJwt('auth', u.id);
			return res.makeResponse(200, 'success', 'signin.success', { token: userToken });
		},
	);
};

export default route;
