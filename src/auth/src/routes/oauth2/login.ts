import { FastifyPluginAsync } from 'fastify';

import { isNullish } from '@shared/utils';
import * as oauth2 from '../../oauth2';

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.get<{ Params: { provider?: string } }>(
		'/api/auth/oauth2/:provider/login',
		{ schema: { hide: true } },
		async function(req, res) {
			if (isNullish(req.params.provider) || !(req.params.provider in this.oauth2)) { return `provider '${req.params.provider ?? 'none'}' doesn't exist`; }
			const provider = this.oauth2[req.params.provider];
			const [challenge, verifier] = oauth2.PkceChallenge.new();

			const u = provider.authorize_url(oauth2.CsrfToken.newRandom, oauth2.Nonce.newRandom);
			u.setPkceChallenge(challenge);

			const [url, _csrf, _nonce] = u.intoUrl();
			void _csrf; void _nonce;
			return res.setCookie('pkce', verifier.secret, { path:'/' }).redirect(url.toString());
		},
	);
};

export default route;
