import { FastifyPluginAsync } from 'fastify';

import { Static, Type } from '@sinclair/typebox';
import { typeResponse, makeResponse, isNullish } from '@shared/utils';

export const GuestLoginRes = Type.Union([
	typeResponse('failed', ['guestLogin.failed.generic.unknown', 'guestLogin.failed.generic.error']),
	typeResponse('success', 'guestLogin.success', {
		token: Type.String({
			description: 'JWT that represent a logged in user',
		}),
	}),
]);

export type GuestLoginRes = Static<typeof GuestLoginRes>;

const getRandomFromList = (list: string[]): string => {
	return list[Math.floor(Math.random() * list.length)];
};

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.post(
		'/api/auth/guest',
		{ schema: { response: { '2xx': GuestLoginRes } } },
		async function(req, res) {
			void req;
			void res;
			try {
				const adjective = getRandomFromList(fastify.words.adjectives);
				const noun = getRandomFromList(fastify.words.nouns);

				const user = await this.db.createUser(
					// no login_name => can't login
					null,
					`${adjective} ${noun}`,
					// no password
					undefined,
					// is a guest
					true,
				);
				if (isNullish(user)) {
					return makeResponse('failed', 'guestLogin.failed.generic.unknown');
				}
				return makeResponse('success', 'guestLogin.success', {
					token: this.signJwt('auth', user.id.toString()),
				});
			}
			catch (e: unknown) {
				fastify.log.error(e);
				return makeResponse('failed', 'guestLogin.failed.generic.error');
			}
		},
	);
};

export default route;
