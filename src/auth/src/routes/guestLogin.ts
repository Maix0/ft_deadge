import { FastifyPluginAsync } from 'fastify';

import { Static, Type } from 'typebox';
import { typeResponse, isNullish, MakeStaticResponse } from '@shared/utils';

export const GuestLoginRes = {
	'500': typeResponse('failed', [
		'guestLogin.failed.generic.unknown',
		'guestLogin.failed.generic.error',
	]),
	'200': typeResponse('success', 'guestLogin.success', {
		token: Type.String({
			description: 'JWT that represent a logged in user',
		}),
	}),
	'400': typeResponse('failed', 'guestLogin.failed.invalid'),
};

export type GuestLoginRes = MakeStaticResponse<typeof GuestLoginRes>;

export const GuestLoginReq = Type.Object({
	name: Type.Optional(Type.String()),
});

export type GuestLoginReq = Static<typeof GuestLoginReq>;

const getRandomFromList = (list: string[]): string => {
	return list[Math.floor(Math.random() * list.length)];
};

const USERNAME_CHECK: RegExp = /^[a-zA-Z_0-9]+$/;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.post<{ Body: GuestLoginReq; Reply: GuestLoginRes }>(
		'/api/auth/guest',
		{
			schema: {
				body: GuestLoginReq,
				response: GuestLoginRes,
				operationId: 'guestLogin',
			},
		},
		async function(req, res) {
			void req;
			void res;
			try {
				let user_name: string | undefined = req.body?.name;
				if (isNullish(user_name)) {
					const adjective = getRandomFromList(
						fastify.words.adjectives,
					);
					const noun = getRandomFromList(fastify.words.nouns);
					user_name = `${adjective}${noun}`;
				}
				else {
					if (user_name.length < 4 || user_name.length > 26) {
						return res.makeResponse(
							400,
							'failed',
							'guestLogin.failed.invalid',
						);
					}
					if (!USERNAME_CHECK.test(user_name)) {
						return res.makeResponse(
							400,
							'failed',
							'guestLogin.failed.invalid',
						);
					}
					user_name = `g_${user_name}`;
				}

				const orig = user_name;
				let i = 0;
				while (
					this.db.getUserFromDisplayName(user_name) !== undefined &&
					i++ < 5
				) {
					user_name = `${orig}${Date.now() % 1000}`;
				}
				if (this.db.getUserFromDisplayName(user_name) !== undefined) {
					user_name = `${orig}${Date.now()}`;
				}

				const user = await this.db.createGuestUser(user_name);
				if (isNullish(user)) {
					return res.makeResponse(
						500,
						'failed',
						'guestLogin.failed.generic.unknown',
					);
				}
				return res.makeResponse(200, 'success', 'guestLogin.success', {
					token: this.signJwt('auth', user.id.toString()),
				});
			}
			catch (e: unknown) {
				fastify.log.error(e);
				return res.makeResponse(
					500,
					'failed',
					'guestLogin.failed.generic.error',
				);
			}
		},
	);
};

export default route;
