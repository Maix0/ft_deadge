import UUID, { newUUID } from '@shared/utils/uuid';
import type { Database } from './_base';
import { UserId } from './user';
import { PongGame, pongGameFromRow, PongGameId } from './pong';
import { isNullish } from '@shared/utils';

// never use this directly

// describe every function in the object
export interface ITournamentDb extends Database {
	getTournamentById(
		this: ITournamentDb,
		id: TournamentId,
	): TournamentData | null,
	createNewTournamentById(
		this: ITournamentDb,
		owner: UserId,
		users: { id: UserId, name: string, score: number }[],
		games: PongGameId[],
	): void,
	getAllTournamentsData(this: ITournamentDb): TournamentTable[],
	getLastTournament(this: ITournamentDb): TournamentTable | undefined;
};

export const TournamentImpl: Omit<ITournamentDb, keyof Database> = {
	/**
	* whole function description
	*
	* @param id the argument description
	*
	* @returns what does the function return ?
	*/
	getTournamentById(
		this: ITournamentDb,
		id: TournamentId,
	): TournamentData | null {
		// Fetch tournament
		const tournament = this
			.prepare('SELECT id, time, owner FROM tournament WHERE id = @id')
			.get({ id }) as TournamentTable;

		if (!tournament) {
			return null;
		}

		// Fetch games

		const games = this.prepare(`
		SELECT 
			pong.*, 
			userL.name AS nameL,
			userR.name AS nameR
		FROM 
			tour_game
		INNER JOIN pong
			ON pong.id == tour_game.game
		INNER JOIN user AS userL
			ON pong.playerL = userL.id
		INNER JOIN user AS userR
			ON pong.playerR = userR.id
		WHERE 
			tour_game.tournament = @id
		ORDER BY pong.id`).all({ id })
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.map((s: any) => {
				const g: (PongGame & { nameL?: string, nameR?: string }) | undefined = pongGameFromRow(s);
				if (isNullish(g)) return undefined;
				g.nameL = s.nameL;
				g.nameR = s.nameR;
				if (isNullish(g.nameL) || isNullish(g.nameR)) return undefined;
				return g as PongGame & { nameL: string, nameR: string };
			}).filter(v => !isNullish(v));
		;

		// Fetch users
		const users = this.prepare('SELECT id, user, tournament, nickname, score FROM tour_user WHERE tournament = @id').all({ id }) as TournamentUser[];

		return {
			...tournament,
			games,
			users,
		};
	},

	createNewTournamentById(
		this: ITournamentDb,
		owner: UserId,
		users: { id: UserId, name: string, score: number }[],
		games: PongGameId[],
	): void {
		const tournamentId = newUUID() as TournamentId;

		this.prepare('INSERT INTO tournament (id, owner) VALUES (@id, @owner)').run({ id: tournamentId, owner });
		for (const u of users) {
			this.prepare('INSERT INTO tour_user (user, nickname, score, tournament) VALUES (@id, @name, @score, @tournament)').run({ id: u.id, name: u.name, score: u.score, tournament: tournamentId });
		}
		for (const g of games) {
			this.prepare('INSERT INTO tour_game (tournament, game) VALUES (@tournament, @game)').run({ tournament: tournamentId, game: g });
		}
	},


	getAllTournamentsData(this: ITournamentDb): TournamentTable[] {
		return this.prepare('SELECT * FROM tournament ORDER BY rowid').all() as TournamentTable[];
	},

	getLastTournament(this: ITournamentDb): TournamentTable | undefined {
		return this.prepare('SELECT * FROM tournament ORDER BY rowid LIMIT 1').get() as TournamentTable | undefined;
	},
};

export type TournamentId = UUID & { readonly __uuid: unique symbol };

export interface TournamentTable {
	id: TournamentId;
	time: string;
	owner: UserId;
}

export interface TournamentUser {
	user: UserId;
	tournament: TournamentId;
	nickname: string;
	score: number;
}

export type TournamentGame = PongGame & { nameL: string, nameR: string };

export interface TournamentData extends TournamentTable {
	games: TournamentGame[];
	users: TournamentUser[];
}

