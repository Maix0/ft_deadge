import { isNullish } from '@shared/utils';
import type { Provider, ProviderSecret, ProviderUserInfo } from './plugins/providers';
import Type, { Static } from '@sinclair/typebox';
import Value from '@sinclair/typebox/value';
import { createHash, randomBytes } from 'node:crypto';

const OpenIdManifest = Type.Object(
	{
		authorization_endpoint: Type.String(),
		token_endpoint: Type.String(),
		userinfo_endpoint: Type.String(),
	},
	{ additionalProperties: true },
);

type OpenIdManifest = Static<typeof OpenIdManifest>;

function removePadding(s: string): string {
	return s.replace(/=+$/, '');
}

export class CsrfToken {
	private constructor(private readonly secret_: string) { }

	public static newRandom(length: number = 16) {
		if (!Number.isInteger(length)) throw 'length must be an integer';
		if (length < 8) throw 'length must be >= 8';
		const bytes = randomBytes(length);
		return new CsrfToken(removePadding(bytes.toString('base64url')));
	}

	public secret(): string {
		return this.secret_;
	}
}

export class Nonce {
	private constructor(private readonly value_: string) { }

	public static newRandom(length: number = 16) {
		if (!Number.isInteger(length)) throw 'length must be an integer';
		if (length < 8) throw 'length must be >= 8';
		const bytes = randomBytes(length);
		return new Nonce(removePadding(bytes.toString('base64url')));
	}

	public value(): string {
		return this.value_;
	}
}

export type PkceMethod = 'S256';

export class PkceVerifier {
	public readonly secret: string;
	public readonly method: PkceMethod;

	public constructor(secret: string, method: PkceMethod) {
		this.secret = secret;
		this.method = method;
	}

	public static new(size: number = 32, method: PkceMethod) {
		if (!Number.isInteger(size)) throw 'size must be an integer';
		if (size < 32 || size > 96) {
			throw 'size must be between 32 and 96 (inclusive)';
		}

		const bytes = randomBytes(size);
		return new PkceVerifier(
			removePadding(bytes.toString('base64url')),
			method,
		);
	}
}

export class PkceChallenge {
	public readonly challenge: string;
	public readonly method: PkceMethod;

	private constructor(challenge: string, method: PkceMethod) {
		this.challenge = challenge;
		this.method = method;
	}

	private static fromVerifier(verifier: PkceVerifier): PkceChallenge {
		switch (verifier.method) {
		case 'S256': {
			const digest = removePadding(
				createHash('sha256')
					.update(verifier.secret)
					.digest('base64url'),
			);

			return new PkceChallenge(digest, verifier.method);
		}
		default:
			throw `Unknown PkceMethod '${verifier.method}'`;
		}
	}

	public static new(
		length: number = 32,
		method: PkceMethod = 'S256',
	): [PkceChallenge, PkceVerifier] {
		const verifier = PkceVerifier.new(length, method);

		return [PkceChallenge.fromVerifier(verifier), verifier];
	}
}

export class AuthorizationUrl {
	private scopes_: Set<string>;
	private pkce_challenge?: PkceChallenge;
	private csrf_token: CsrfToken;
	private nonce: Nonce;

	constructor(
		public readonly auth_url: URL,
		public readonly redirect_url: URL,
		public readonly client_id: string,
		csrf_token: () => CsrfToken,
		nonce: () => Nonce,
		public readonly additional: [string, string][],
	) {
		this.scopes_ = new Set();
		this.csrf_token = csrf_token();
		this.nonce = nonce();
	}

	get scopes(): readonly string[] {
		return Array.from(this.scopes_.values());
	}

	public addScope(scope: string) {
		this.scopes_.add(scope);
	}

	public setPkceChallenge(challenge: PkceChallenge) {
		this.pkce_challenge = challenge;
	}

	public intoUrl(): [URL, CsrfToken, Nonce] {
		const scopes = this.scopes_.values().toArray().join(' ');

		const url = (() => {
			const u = this.auth_url;
			const pairs: [string, string][] = [
				['response_type', 'code'],
				['client_id', this.client_id],
				['state', this.csrf_token.secret()],
				['nonce', this.nonce.value()],
			];
			if (!isNullish(this.pkce_challenge)) {
				pairs.push(['code_challenge', this.pkce_challenge.challenge]);
				pairs.push([
					'code_challenge_method',
					this.pkce_challenge.method,
				]);
			}
			if (!isNullish(this.redirect_url)) {
				pairs.push(['redirect_uri', this.redirect_url.toString()]);
			}

			if (scopes.length !== 0) pairs.push(['scope', scopes]);
			this.additional.forEach((p) => pairs.push(p));

			for (const [k, v] of pairs) u.searchParams.set(k, v);
			return u;
		})();

		return [url, this.csrf_token, this.nonce];
	}
}

export class AuthorizationCode {
	public constructor(private readonly code: string) { }

	public secret(): string {
		return this.code;
	}
}
export class CodeTokenRequest {
	private pkce_verifier?: PkceVerifier;

	public constructor(
		private readonly client_id: string,
		private readonly client_secret: string,
		private readonly token_url: URL,
		private readonly redirect_url: URL,
		private readonly code: AuthorizationCode,
	) { }

	public setPkceVerifier(val: PkceVerifier) {
		this.pkce_verifier = val;
	}

	public async getCode(): Promise<string> {
		const params: [string, string][] = [
			['grant_type', 'authorization_code'],
			['code', this.code.secret()],
			['redirect_uri', this.redirect_url.toString()],
			['client_id', this.client_id],
			['client_secret', this.client_secret],
		];

		if (!isNullish(this.pkce_verifier)) {
			params.push(['code_verifier', this.pkce_verifier.secret]);
		}
		const req = await fetch(this.token_url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
				Authorization: `BASIC ${removePadding(Buffer.from(`${encodeURIComponent(this.client_id)}:${encodeURIComponent(this.client_secret)}`).toString('base64url'))}`,
				'User-Agent': 'ft_transcendance (maix.me, 1)',
			},
			body: (() => {
				return new URLSearchParams(params);
			})(),
		});
		if (!req.ok) {
			throw `failed to fetch code from oauth2 provider: ${req.status} - ${req.statusText} body: ${await req.text()}`;
		}
		const body = await req.json();
		if (
			typeof body !== 'object' ||
			isNullish(body) ||
			!('access_token' in body)
		) {
			throw `response doesn't have an access body: ${JSON.stringify(body)}`;
		}

		return body.access_token as string;
	}
}

export class Oauth2 {
	public readonly auth_url: URL;
	public readonly token_url: URL;
	public readonly info_url: URL;
	public readonly redirect_url: URL;

	private constructor(
		auth_url: string,
		token_url: string,
		info_url: string,
		redirect_url: string,

		public readonly client_id: string,
		private readonly client_secret: string,
		public readonly display_name: string,
		public readonly scopes: string[],
		public readonly keys: { name: string, unique_id: string },
	) {
		this.auth_url = new URL(auth_url);
		this.token_url = new URL(token_url);
		this.info_url = new URL(info_url);
		this.redirect_url = new URL(redirect_url);
	}

	private static handleClientSecret(secret: ProviderSecret): string {
		if ('env' in secret) {
			const value = process.env[secret.env];
			if (isNullish(value)) {
				throw `'${secret.env}' not present in environment variables`;
			}
			return value;
		}
		else if ('inline' in secret) {
			return secret.inline;
		}
		else {
			throw 'invalid provider secret: not either env|inner in secret';
		}
	}

	public exchangeCode(code: AuthorizationCode): CodeTokenRequest {
		return new CodeTokenRequest(
			this.client_id,
			this.client_secret,
			this.token_url,
			this.redirect_url,
			code,
		);
	}

	public authorize_url(
		csrf_token: () => CsrfToken,
		nonce: () => Nonce,
		extra_pairs?: [string, string][],
	): AuthorizationUrl {
		if (isNullish(extra_pairs)) {
			extra_pairs = [];
		}
		const u = new AuthorizationUrl(
			this.auth_url,
			this.redirect_url,
			this.client_id,
			csrf_token,
			nonce,
			extra_pairs,
		);
		this.scopes.forEach((scope) => u.addScope(scope));
		return u;
	}

	static async fromProvider(
		display_name: string,
		provider: Provider,
	): Promise<Oauth2> {
		try {
			const secret = Oauth2.handleClientSecret(provider.client_secret);
			const id = provider.client_id;
			if ('openid_url' in provider) {
				const req = await fetch(
					`${provider.openid_url}/.well-known/openid-configuration`,
				);
				const j = await req.json();
				const v = Value.Parse(OpenIdManifest, j);
				if (!('openid' in provider.scopes)) {
					provider.scopes.push('openid');
				}

				return new Oauth2(
					v.authorization_endpoint,
					v.token_endpoint,
					v.userinfo_endpoint,
					provider.redirect_url,
					id,
					secret,
					display_name,
					provider.scopes,
					provider.user,
				);
			}
			else if ('token_url' in provider) {
				return new Oauth2(
					provider.auth_url,
					provider.token_url,
					provider.info_url,
					provider.redirect_url,
					id,
					secret,
					display_name,
					provider.scopes,
					provider.user,
				);
			}
			throw 'unknown provider type';
		}
		catch (e) {
			throw `provider "${display_name}": ${e}`;
		}
	}


	public async getUserInfo(token: string): Promise<ProviderUserInfo> {
		const req = await fetch(this.info_url, {
			method: 'GET', headers: {
				'Accept': 'application/json',
				'Authorization': `Bearer ${token}`,
				'User-Agent': 'ft_transcendance (maix.me, 1)',
			},
		});
		if (!req.ok) {
			throw `failed to fetch userinfo from oauth2 provider: ${req.status} - ${req.statusText} body: ${await req.text()}`;
		}

		/* eslint-disable @typescript-eslint/no-explicit-any */
		/* we know that it is a json object, just we don't know the form of it. */
		/* the next line will allow us to make sure that it is an object, with required field and that they are strings */
		const json: any = await req.json();

		if (typeof json !== 'object' || isNullish(json)) { throw 'failed to fetch userinfo from oauth2 provider: not a json object'; }
		for (const [k, v] of Object.entries(this.keys)) {
			if (!(v in json) || (typeof json[v] !== 'string')) { throw `failed to fetch userinfo from oauth2 provider: '${v}'(${k} key) not present in response`; }
		}

		return Object.fromEntries(Object.entries(this.keys).map(([k, v]) => [k, json[v] as string])) as ProviderUserInfo;
	}
}

