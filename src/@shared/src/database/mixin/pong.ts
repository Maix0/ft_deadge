import UUID from '@shared/utils/uuid';
import type { Database } from './_base';
import { UserId } from './user';
import { isNullish } from '@shared/utils';

export type PongGameOutcome = 'winR' | 'winL' | 'other';

// describe every function in the object
export interface IPongDb extends Database {
	setPongGameOutcome(
		this: IPongDb,
		id: PongGameId,
		left: { id: UserId, score: number },
		right: { id: UserId, score: number },
		outcome: PongGameOutcome,
		local: boolean,
	): void;
	getPongGameFromId(
		this: IPongDb,
		id: PongGameId,
	): PongGame | undefined,

	getAllPongGameForUser(
		this: IPongDb,
		id: UserId,
	): (PongGame & { nameL: string, nameR: string })[],
}

export const PongImpl: Omit<IPongDb, keyof Database> = {
	/**
	 * @brief Write the outcome of the specified game to the database.
	 *
	 * @param gameId The game we want to write the outcome of.
	 *
	 */
	setPongGameOutcome(
		this: IPongDb,
		id: PongGameId,
		left: { id: UserId, score: number },
		right: { id: UserId, score: number },
		outcome: PongGameOutcome,
		local: boolean,
	): void {
		// Find a way to retrieve the outcome of the game.
		this.prepare(
			'INSERT INTO pong (id, playerL, playerR, scoreL, scoreR, outcome, local) VALUES (@id, @playerL, @playerR, @scoreL, @scoreR, @outcome, @local)',
		).run({ id, playerL: left.id, scoreL: left.score, playerR: right.id, scoreR: right.score, outcome, local: local ? 1 : 0 });
	},

	getPongGameFromId(
		this: IPongDb,
		id: PongGameId,
	): PongGame | undefined {
		const q = this.prepare('SELECT * FROM pong WHERE id = @id').get({ id }) as Partial<PongGameTable> | undefined;
		return pongGameFromRow(q);
	},

	getAllPongGameForUser(
		this: IPongDb,
		id: UserId,
	): (PongGame & { nameL: string, nameR: string })[] {
		const q = this.prepare(`
	SELECT
		pong.*,
		userL.name AS nameL,
		userR.name AS nameR
	FROM pong
	INNER JOIN user AS userL
		ON pong.playerL = userL.id
	INNER JOIN user AS userR
		ON pong.playerR = userR.id
	WHERE
		pong.playerL = @id
		OR pong.playerR = @id;
`);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return q.all({ id }).map((s: any) => {
			const g: (PongGame & { nameL?: string, nameR?: string }) | undefined = pongGameFromRow(s);
			if (isNullish(g)) return undefined;
			g.nameL = s.nameL;
			g.nameR = s.nameR;
			if (isNullish(g.nameL) || isNullish(g.nameR)) return undefined;
			return g as PongGame & { nameL: string, nameR: string };
		}).filter(v => !isNullish(v));
	},
};

export type PongGameId = UUID & { readonly __uuid: unique symbol };

export type PongGame = {
	readonly id: PongGameId;
	readonly left: { id: UserId, score: number };
	readonly right: { id: UserId, score: number };
	readonly outcome: PongGameOutcome;
	readonly time: Date;
	readonly local: boolean;
};

// this is an internal type, never to be seen outside
type PongGameTable = {
	id: PongGameId,
	playerL: UserId,
	playerR: UserId,
	scoreL: number,
	scoreR: number,
	outcome: PongGameOutcome,
	time: string,
	local: number,
};

function pongGameFromRow(r: Partial<PongGameTable> | undefined): PongGame | undefined {
	if (isNullish(r)) return undefined;
	if (isNullish(r.id)) return undefined;
	if (isNullish(r.playerL)) return undefined;
	if (isNullish(r.playerR)) return undefined;
	if (isNullish(r.scoreL)) return undefined;
	if (isNullish(r.scoreR)) return undefined;
	if (isNullish(r.outcome)) return undefined;
	if (isNullish(r.time)) return undefined;
	if (isNullish(r.local)) return undefined;

	if (r.outcome !== 'winR' && r.outcome !== 'winL' && r.outcome !== 'other') return undefined;
	const date = Date.parse(r.time);
	if (Number.isNaN(date)) return undefined;


	return {
		id: r.id,
		left: { id: r.playerL, score: r.scoreL },
		right: { id: r.playerR, score: r.scoreR },
		outcome: r.outcome,
		time: new Date(date),
		local: r.local !== 0,
	};
}
