import { FastifyPluginAsync } from 'fastify';

import { Type } from 'typebox';
import { typeResponse, isNullish, MakeStaticResponse } from '@shared/utils';

export const GuestLoginRes = {
	'500': typeResponse('failed', ['guestLogin.failed.generic.unknown', 'guestLogin.failed.generic.error']),
	'200': typeResponse('success', 'guestLogin.success', {
		token: Type.String({
			description: 'JWT that represent a logged in user',
		}),
	}),
};

export type GuestLoginRes = MakeStaticResponse<typeof GuestLoginRes>;

const getRandomFromList = (list: string[]): string => {
	return list[Math.floor(Math.random() * list.length)];
};

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.post<{ Body: null, Reply: GuestLoginRes }>(
		'/api/auth/guest',
		{ schema: { response: GuestLoginRes, operationId: 'guestLogin' } },
		async function(req, res) {
			void req;
			void res;
			try {
				console.log('DEBUG ----- guest login backend');
				const adjective = getRandomFromList(fastify.words.adjectives);
				const noun = getRandomFromList(fastify.words.nouns);

				const user = await this.db.createGuestUser(`${adjective} ${noun}`);
				if (isNullish(user)) {
					return res.makeResponse(500, 'failed', 'guestLogin.failed.generic.unknown');
				}
				return res.makeResponse(200, 'success', 'guestLogin.success', {
					token: this.signJwt('auth', user.id.toString()),
				});
			}
			catch (e: unknown) {
				fastify.log.error(e);
				return res.makeResponse(500, 'failed', 'guestLogin.failed.generic.error');
			}
		},
	);
};

export default route;
