import { FastifyPluginAsync } from 'fastify';

import { Static, Type } from 'typebox';
import { typeResponse, MakeStaticResponse } from '@shared/utils';

const ChangePasswordReq = Type.Object({
	new_password: Type.String(),
});

type ChangePasswordReq = Static<typeof ChangePasswordReq>;

const ChangePasswordRes = {
	'500': typeResponse('failed',
		'changePassword.failed.generic'),
	'400': typeResponse('failed', [
		'changePassword.failed.toolong',
		'changePassword.failed.tooshort',
		'changePassword.failed.invalid',
	]),
	'200': typeResponse('success', 'changePassword.success'),
};

type ChangePasswordRes = MakeStaticResponse<typeof ChangePasswordRes>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.post<{ Body: ChangePasswordReq }>(
		'/api/auth/changePassword',
		{ schema: { body: ChangePasswordReq, response: ChangePasswordRes, operationId: 'changePassword' }, config: { requireAuth: true } },
		async function(req, res) {
			const password = req.body.new_password;

			if (password.length < 8) { return res.makeResponse(400, 'failed', 'changePassword.failed.tooshort'); }
			if (password.length > 64) { return res.makeResponse(400, 'failed', 'changePassword.failed.toolong'); }
			// password is good too !

			await this.db.setUserPassword(req.authUser!.id, password);

			return res.makeResponse(200, 'success', 'changePassword.success');
		},
	);
};

export default route;
