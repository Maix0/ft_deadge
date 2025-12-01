import { isNullish } from '@shared/utils';
import type { Database } from './_base';
import { UserId } from './user';


// describe every function in the object
export interface IBlockedDb extends Database {
	getBlockedUserFor(id: UserId): BlockedData[],
	addBlockedUserFor(id: UserId, blocked: UserId): void,
	removeBlockedUserFor(id: UserId, blocked: UserId): void,
	unblockAllUserFor(id: UserId): void,
	getAllBlockedUsers(this: IBlockedDb): BlockedData[] | undefined,

};

export const BlockedImpl: Omit<IBlockedDb, keyof Database> = {
	getBlockedUserFor(this: IBlockedDb, id: UserId): BlockedData[] {
		const query = this.prepare('SELECT * FROM blocked WHERE user = @id');
		const data = query.all({ id }) as Partial<BlockedData>[];
		return data.map(blockedFromRow).filter(b => !isNullish(b));
	},

	unblockAllUserFor(this: IBlockedDb, id: UserId): void {
		this.prepare('DELETE FROM blocked WHERE user = @id').run({ id });
	},
	addBlockedUserFor(this: IBlockedDb, id: UserId, blocked: UserId): void {
		this.prepare('INSERT OR IGNORE INTO blocked (user, blocked) VALUES (@id, @blocked)').run({ id, blocked });
	},
	removeBlockedUserFor(this: IBlockedDb, id: UserId, blocked: UserId): void {
		this.prepare('DELETE FROM blocked WHERE user = @id AND blocked = @blocked').run({ id, blocked });
	},

	
	/**
	 * Get all blocked user
	 *
	 * @param 
	 *
	 * @returns The list of users if it exists, undefined otherwise
	 */
	getAllBlockedUsers(this: IBlockedDb): BlockedData[] {
		const rows = this.prepare('SELECT * FROM blocked').all() as Partial<BlockedData>[];

		return rows
			.map(row => blockedFromRow(row))
			.filter((u): u is BlockedData => u !== undefined);
	},

};

export type BlockedId = number & { readonly __brand: unique symbol };

export type BlockedData = {
	readonly id: BlockedId;
	readonly user: UserId;
	readonly blocked: UserId;
};

/**
 * Get a blocked from a row
 *
 * @param row The data from sqlite
 *
 * @returns The blocked if it exists, undefined otherwise
 */
export function blockedFromRow(row?: Partial<BlockedData>): BlockedData | undefined {
	console.log('HELLO ?????', row);
	if (isNullish(row)) return undefined;
	if (isNullish(row.id)) return undefined;
	if (isNullish(row.user)) return undefined;
	if (isNullish(row.blocked)) return undefined;

	return row as BlockedData;
}
