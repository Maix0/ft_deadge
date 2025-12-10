import { FastifyPluginAsync } from 'fastify';

import { Static, Type } from 'typebox';
import { typeResponse, isNullish } from '@shared/utils';
import * as oauth2 from '../../oauth2';


export const WhoAmIRes = Type.Union([
	typeResponse('success', 'disableOtp.success'),
	typeResponse('failure', 'disableOtp.failure.generic'),
]);

export type WhoAmIRes = Static<typeof WhoAmIRes>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.get<{ Params: { provider?: string } }>(
		'/api/auth/oauth2/:provider/callback',
		{ schema: { hide: true } },
		async function(req, res) {
			const qs = (req.query as { [k: string]: string });
			if (isNullish(req.params.provider) || !(req.params.provider in this.oauth2)) { return `provider '${req.params.provider ?? 'none'}' doesn't exist`; }
			const provider = this.oauth2[req.params.provider];
			if (!('code' in qs)) { return res.code(400).send('no code in querystring...'); }
			if (!('pkce' in req.cookies) || isNullish(req.cookies.pkce)) { return res.code(400).send('no pkce cookies'); }
			const code = new oauth2.AuthorizationCode(qs.code);
			const pkce = new oauth2.PkceVerifier(req.cookies.pkce!, 'S256');
			const creq = provider.exchangeCode(code);
			creq.setPkceVerifier(pkce);
			const result = await creq.getCode();

			const userinfo = await provider.getUserInfo(result);


			let u = this.db.getOauth2User(provider.display_name, userinfo.unique_id);
			if (isNullish(u)) {
				let user_name = userinfo.name;
				const orig = user_name;
				let i = 0;
				while (
					this.db.getUserFromDisplayName(user_name) !== undefined &&
					i++ < 100
				) {
					user_name = `${orig}${Date.now() % 1000}`;
				}
				if (this.db.getUserFromDisplayName(user_name) !== undefined) {
					user_name = `${orig}${Date.now()}`;
				}
				u = await this.db.createOauth2User(user_name, provider.display_name, userinfo.unique_id);
			}
			if (isNullish(u)) {
				return res.code(500).send('failed to fetch or create user...');
			}
			const token = this.signJwt('auth', u.id);


			return res.setCookie('token', token, { path: '/' }).redirect('/app/');
		},
	);
};

export default route;
