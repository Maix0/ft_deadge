import { isNullish } from '@shared/utils';
import type { Database } from './_base';
import { UserId } from './user';


// describe every function in the object
export interface IFriendsDb extends Database {
	getFriendsUserFor(id: UserId): FriendsData[],
	addFriendsUserFor(id: UserId, friend: UserId): void,
	removeFriendsUserFor(id: UserId, friend: UserId): void,
	removeAllFriendUserFor(id: UserId): void,
	getAllFriendsUsers(this: IFriendsDb): FriendsData[] | undefined,

};

export const FriendsImpl: Omit<IFriendsDb, keyof Database> = {
	getFriendsUserFor(this: IFriendsDb, id: UserId): FriendsData[] {
		const query = this.prepare('SELECT * FROM friends WHERE user = @id');
		const data = query.all({ id }) as Partial<FriendsData>[];
		return data.map(friendsFromRow).filter(b => !isNullish(b));
	},

	removeAllFriendUserFor(this: IFriendsDb, id: UserId): void {
		this.prepare('DELETE FROM friends WHERE user = @id').run({ id });
	},
	addFriendsUserFor(this: IFriendsDb, id: UserId, friend: UserId): void {
		this.prepare('INSERT OR IGNORE INTO friends (user, friend) VALUES (@id, @friend)').run({ id, friend });
	},
	removeFriendsUserFor(this: IFriendsDb, id: UserId, friend: UserId): void {
		this.prepare('DELETE FROM friends WHERE user = @id AND friend = @friend').run({ id, friend });
	},

	/**
	 * Get all friends user
	 *
	 * @param
	 *
	 * @returns The list of users if it exists, undefined otherwise
	 */
	getAllFriendsUsers(this: IFriendsDb): FriendsData[] {
		const rows = this.prepare('SELECT * FROM friends').all() as Partial<FriendsData>[];

		return rows
			.map(row => friendsFromRow(row))
			.filter((u): u is FriendsData => u !== undefined);
	},

};

export type FriendsId = number & { readonly __brand: unique symbol };

export type FriendsData = {
	readonly id: FriendsId;
	readonly user: UserId;
	readonly friend: UserId;
};

/**
 * Get a friends from a row
 *
 * @param row The data from sqlite
 *
 * @returns The friends if it exists, undefined otherwise
 */
export function friendsFromRow(row?: Partial<FriendsData>): FriendsData | undefined {
	if (isNullish(row)) return undefined;
	if (isNullish(row.id)) return undefined;
	if (isNullish(row.user)) return undefined;
	if (isNullish(row.friend)) return undefined;

	return row as FriendsData;
}
