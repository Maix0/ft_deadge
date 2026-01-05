import UUID from '@shared/utils/uuid';
import type { Database } from './_base';
import { UserId } from './user';

// describe every function in the object
export interface ITicTacToeDb extends Database {
	setTTTGameOutcome(this: ITicTacToeDb, id: TTTGameId, player1: UserId, player2: UserId, outcome: string): void,
};

export const TicTacToeImpl: Omit<ITicTacToeDb, keyof Database> = {
	/**
	 * @brief Write the outcome of the specified game to the database.
	 *
	 * @param gameId The game we want to write the outcome of.
	 *
	 */
	setTTTGameOutcome(this: ITicTacToeDb, id: TTTGameId, player1: UserId, player2: UserId, outcome: string): void {
		// Find a way to retrieve the outcome of the game.
		this.prepare('INSERT INTO tictactoe (id, player1, player2, outcome) VALUES (@id, @player1, @player2, @outcome)').run({ id, player1, player2, outcome });
	},
};

export type TTTGameId = UUID & { readonly __brand: unique symbol };

export type TicTacToeGame = {
	readonly id: TTTGameId;
	readonly player1: UserId;
	readonly player2: UserId;
	readonly outcome: string;
};

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
