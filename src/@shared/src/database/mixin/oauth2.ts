// import type { Database } from './_base';
import { isNullish } from '@shared/utils';
import { UserId, IUserDb, userFromRow, User } from './user';

// never use this directly

export interface IOauthDb extends IUserDb {
	getAllFromProvider(this: IOauthDb, provider: string): ProviderUser[],
	getProviderUser(this: IOauthDb, provider: string, unique_id: string): ProviderUser | undefined,
	getUserFromProviderUser(this: IOauthDb, provider: string, unique_id: string): User | undefined,
	getUserFromProviderUserId(this: IOauthDb, id: ProviderUserId): User | undefined,
	getProviderUserFromId(this: IOauthDb, id: ProviderUserId): ProviderUser | undefined,

	createUserWithProvider(this: IOauthDb, provider: string, unique_id: string, username: string): Promise<User | undefined>,
};

export const OauthImpl: Omit<IOauthDb, keyof IUserDb> = {
	getAllFromProvider(this: IOauthDb, provider: string): ProviderUser[] {
		return this.prepare('SELECT * FROM auth WHERE provider = @provider')
			.all({ provider })
			.map(r => providerUserFromRow(r as Partial<ProviderUser> | undefined))
			.filter(v => !isNullish(v)) ?? [];
	},

	getProviderUser(this: IOauthDb, provider: string, unique_id: string): ProviderUser | undefined {
		unique_id = `provider:${unique_id}`;
		return providerUserFromRow(this.prepare('SELECT * FROM auth WHERE provider = @provider AND oauth2_user = @unique_id')
			.get({ provider, unique_id }) as Partial<ProviderUser> | undefined);
	},

	getProviderUserFromId(this: IOauthDb, id: ProviderUserId): ProviderUser | undefined {
		return providerUserFromRow(this.prepare('SELECT * FROM auth WHERE id = @id')
			.get({ id }) as Partial<ProviderUser> | undefined);
	},

	getUserFromProviderUser(this: IOauthDb, provider: string, unique_id: string): User | undefined {
		unique_id = `provider:${unique_id}`;
		return userFromRow(
			this.prepare('SELECT user.* from auth INNER JOIN user ON user.id = auth.user WHERE auth.provider = @provider AND auth.oauth2_user = @unique_id')
				.get({ provider, unique_id }) as Partial<User> | undefined,
		);
	},

	getUserFromProviderUserId(this: IOauthDb, id: ProviderUserId): User | undefined {
		return userFromRow(
			this.prepare('SELECT user.* from auth INNER JOIN user ON user.id = auth.user WHERE auth.id = @id')
				.get({ id }) as Partial<User> | undefined,
		);
	},

	async createUserWithProvider(this: IOauthDb, provider: string, unique_id: string, username: string): Promise<User | undefined> {
		unique_id = `provider:${unique_id}`;
		const user = await this.createUser(null, username, undefined, false);
		if (isNullish(user)) { return undefined; }
		this.prepare('INSERT INTO auth (provider, user, oauth2_user) VALUES (@provider, @user_id, @unique_id)').run({ provider, user_id: user.id, unique_id });
		return user;
	},
};

export type ProviderUserId = number & { readonly __brand: unique symbol };

export type ProviderUser = {
	readonly id: ProviderUserId,
	readonly provider: string,
	readonly user: UserId,
	readonly oauth2_user: string,
};

/**
 * Get a user from a row
 *
 * @param row The data from sqlite
 *
 * @returns The user if it exists, undefined otherwise
 */
function providerUserFromRow(row?: Partial<ProviderUser>): ProviderUser | undefined {
	if (isNullish(row)) return undefined;
	if (isNullish(row.id)) return undefined;
	if (isNullish(row.provider)) return undefined;
	if (isNullish(row.user)) return undefined;
	if (isNullish(row.oauth2_user)) return undefined;
	return {
		id: row.id,
		provider: row.provider,
		user: row.user,
		oauth2_user: row.oauth2_user,
	};
}
