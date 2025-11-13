import { isNullish } from '@shared/utils';
import fp from 'fastify-plugin';
import { access, constants as fsConstants, readFile } from 'node:fs/promises';
import * as T from 'typebox';
import * as V from 'typebox/value';
import { Oauth2 } from '../oauth2';
import { parseTOML } from 'confbox';

const ProviderSecret = T.Union([
	T.Object({
		env: T.String({ description: 'Secret is stored in the env var' }),
	}),
	T.Object({ inline: T.String({ description: 'Secret is inline here' }) }),
]);

const ProviderUserInfo = T.Object(
	{
		unique_id: T.String({
			description: 'A unique identifier for this provider',
			default: 'email',
		}),
		name: T.String({
			description: 'A name for this provider',
			default: 'name',
		}),
	},
	{ default: { unique_id: 'email', name: 'name' } },
);

const RawProviderBase = {
	client_id: T.String(),
	client_secret: ProviderSecret,
	scopes: T.Array(T.String()),
	redirect_url: T.String(),
	user: ProviderUserInfo,
	display_name: T.String(),
	color: T.Optional(
		T.Object({
			default: T.Optional(T.String()),
			hover: T.Optional(T.String()),
		}),
	),
};

const ProviderBase = T.Object(RawProviderBase);
const ProviderOauth2 = T.Object({
	token_url: T.String(),
	auth_url: T.String(),
	info_url: T.String(),
	...RawProviderBase,
});
const ProviderOpenId = T.Object({ openid_url: T.String(), ...RawProviderBase });
const Provider = T.Union([ProviderOauth2, ProviderOpenId]);
const ProviderMap = T.Record(T.String(), Provider);
const ProviderMapFile = T.Object({
	providers: ProviderMap,
	$schema: T.Optional(T.String()),
});

// console.log(JSON.stringify(ProviderMapFile))

export type ProviderSecret = T.Static<typeof ProviderSecret>;
export type ProviderUserInfo = T.Static<typeof ProviderUserInfo>;
export type ProviderBase = T.Static<typeof ProviderBase>;
export type ProviderOauth2 = T.Static<typeof ProviderOauth2>;
export type ProviderOpenId = T.Static<typeof ProviderOpenId>;
export type Provider = T.Static<typeof Provider>;
export type ProviderMap = T.Static<typeof ProviderMap>;

export type ProviderMapFile = T.Static<typeof ProviderMapFile>;
async function buildProviderMap(): Promise<ProviderMap> {
	const providerFile = process.env.PROVIDER_FILE;
	if (isNullish(providerFile)) return {};
	try {
		await access(providerFile, fsConstants.F_OK | fsConstants.R_OK);
	}
	catch {
		return {};
	}
	const data = await readFile(providerFile, { encoding: 'utf-8' });
	const dataJson = parseTOML(data);
	return V.Parse(ProviderMapFile, dataJson).providers;
}

declare module 'fastify' {
	export interface FastifyInstance {
		providers: ProviderMap;
		oauth2: { [k: string]: Oauth2 };
	}
}
async function makeAllOauth2(
	providers: ProviderMap,
): Promise<{ [k: string]: Oauth2 }> {
	const out: { [k: string]: Oauth2 } = {};
	for (const [k, v] of Object.entries(providers)) {
		out[k] = await Oauth2.fromProvider(k, v);
	}
	return out;
}

export default fp(async (fastify) => {
	fastify.decorate('providers', await buildProviderMap());
	fastify.decorate('oauth2', await makeAllOauth2(fastify.providers));
});
