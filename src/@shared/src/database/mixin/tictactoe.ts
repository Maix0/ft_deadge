import UUID from '@shared/utils/uuid';
import type { Database } from './_base';
import { UserId } from './user';
import { isNullish } from '@shared/utils';

export type TicTacToeOutcome = 'winX' | 'winO' | 'other';
// describe every function in the object
export interface ITicTacToeDb extends Database {
	setTTTGameOutcome(this: ITicTacToeDb, id: TTTGameId, player1: UserId, player2: UserId, outcome: TicTacToeOutcome): void,
	getAllTTTGameForUser(
		this: ITicTacToeDb,
		id: UserId,
	): (TicTacToeGame & { nameX: string, nameO: string })[],
};


export const TicTacToeImpl: Omit<ITicTacToeDb, keyof Database> = {
	/**
	 * @brief Write the outcome of the specified game to the database.
	 *
	 * @param gameId The game we want to write the outcome of.
	 *
	 */
	setTTTGameOutcome(this: ITicTacToeDb, id: TTTGameId, playerX: UserId, playerO: UserId, outcome: TicTacToeOutcome): void {
		// Find a way to retrieve the outcome of the game.
		this.prepare('INSERT INTO tictactoe (id, playerX, playerO, outcome) VALUES (@id, @playerX, @playerO, @outcome)').run({ id, playerX, playerO, outcome });
	},

	getAllTTTGameForUser(
		this: ITicTacToeDb,
		id: UserId,
	): (TicTacToeGame & { nameX: string, nameO: string })[] {
		const q = this.prepare(`
			SELECT
				tictactoe.*,
				userX.name AS nameX,
				userO.name AS nameO
			FROM tictactoe
			INNER JOIN user AS userX
				ON tictactoe.playerX = userX.id
			INNER JOIN user AS userO
				ON tictactoe.playerO = userO.id
			WHERE
				tictactoe.playerX = @id
				OR tictactoe.playerO = @id;
		`);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return q.all({ id }).map((s: any) => {
			const g: (TicTacToeGame & { nameX?: string, nameO?: string }) | undefined = TicTacToeGameFromRow(s);
			if (isNullish(g)) return undefined;
			g.nameX = s.nameX;
			g.nameO = s.nameO;
			if (isNullish(g.nameO) || isNullish(g.nameO)) return undefined;
			return g as TicTacToeGame & { nameX: string, nameO: string };
		}).filter(v => !isNullish(v));
	},
};

export type TTTGameId = UUID & { readonly __uuid: unique symbol };

export type TicTacToeGame = {
	readonly id: TTTGameId;
	readonly time: Date;
	readonly playerX: UserId;
	readonly playerO: UserId;
	readonly outcome: TicTacToeOutcome;
};

type TicTacToeGameTable = {
	id: string;
	time: string;
	playerX: UserId;
	playerO: UserId;
	outcome: string;
};

function TicTacToeGameFromRow(r: Partial<TicTacToeGameTable> | undefined): TicTacToeGame | undefined {
	if (isNullish(r)) return undefined;
	if (isNullish(r.id)) return undefined;
	if (isNullish(r.playerX)) return undefined;
	if (isNullish(r.playerO)) return undefined;
	if (isNullish(r.outcome)) return undefined;
	if (isNullish(r.time)) return undefined;

	if (r.outcome !== 'winX' && r.outcome !== 'winO' && r.outcome !== 'other') return undefined;
	const date = Date.parse(r.time);
	if (Number.isNaN(date)) return undefined;


	return {
		id: r.id as TTTGameId,
		playerX: r.playerX,
		playerO: r.playerO,
		outcome: r.outcome,
		time: new Date(date),
	};
}

// this function will be able to be called from everywhere
// export async function freeFloatingExportedFunction(): Promise<boolean> {
//     return false;
// }

// this function will never be able to be called outside of this module
// async function privateFunction(): Promise<string | undefined> {
//     return undefined;
// }

// silence warnings
// void privateFunction;
