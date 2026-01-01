import type { Database } from './_base';
import { UserId } from './user';
// import { UserId } from './user';

// describe every function in the object
export interface ITicTacToeDb extends Database {
	setGameOutcome(this: ITicTacToeDb, id: GameId, player1: UserId, player2: UserId, outcome: string): void,
	// 	asyncFunction(id: TemplateId): Promise<TemplateData | undefined>,
};

export const TicTacToeImpl: Omit<ITicTacToeDb, keyof Database> = {
	/**
	 * @brief Write the outcome of the specified game to the database.
	 *
	 * @param gameId The game we want to write the outcome of.
	 *
	 */
	setGameOutcome(this: ITicTacToeDb, id: GameId, player1: string, player2: string, outcome: string): void {
		// Find a way to retrieve the outcome of the game.
		this.prepare('INSERT INTO tictactoe (id, player1, player2, outcome) VALUES (@id, @player1, @player2, @outcome)').run({ id, player1, player2, outcome });
	},
	/**
	 * whole function description
	 *
	 * @param id the argument description
	 *
	 * @returns what does the function return ?
	 */
	//     async asyncFunction(this: ITemplateDb, id: TemplateId): Promise<TemplateData | undefined> {
	//         void id;
	//         return undefined;
	//     },
};

export type GameId = string & { readonly __brand: unique symbol };

export type TicTacToeData = {
	readonly id: GameId;
	readonly player1: string;
	readonly player2: string;
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
