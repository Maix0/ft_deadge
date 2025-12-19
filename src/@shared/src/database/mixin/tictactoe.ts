import type { Database } from './_base';
// import { UserId } from './user';

// describe every function in the object
export interface ITicTacToeDb extends Database {
	normalFunction(id: TemplateId): TemplateData | undefined,
	asyncFunction(id: TemplateId): Promise<TemplateData | undefined>,
};

export const TicTacToeImpl: Omit<ITicTacToeDb, keyof Database> = {
	/**
	 * @brief Write the outcome of the specified game to the database.
	 *
	 * @param gameId The game we want to write the outcome of.
	 *
	 */
	setGameOutcome(this: ITicTacToeDb, id: GameId): void {
		// Find a way to retrieve the outcome of the game.
		this.prepare('INSERT INTO tictactoe (game, outcome) VALUES (@id, "draw" /* replace w/ game outcome */)').run({ id });
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

export type TicTacToeId = number & { readonly __brand: unique symbol };

export type TemplateData = {
	readonly id: TicTacToeId;
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
void privateFunction;
