import { PongGameId } from '@shared/database/mixin/pong';
import { UserId } from '@shared/database/mixin/user';
import { shuffle } from '@shared/utils';
import { newUUID } from '@shared/utils/uuid';
import { Pong } from './game';

type TourUser = {
	id: UserId;
	score: number;
	name: string;
};

export class Tournament {
	public users: Map<UserId, TourUser> = new Map();
	public currentGame: PongGameId | null = null;
	public games: Map<PongGameId, Pong> = new Map();
	public started: boolean = false;
	public gameUpdate: NodeJS.Timeout | undefined;

	constructor(public owner: UserId) { }

	public addUser(id: UserId, name: string) {
		if (this.started) return;
		this.users.set(id, { id, name, score: 0 });
	}

	public removeUser(id: UserId) {
		if (this.started) return;
		this.users.delete(id);
	}

	public start() {
		this.started = true;
		const users = Array.from(this.users.keys());
		const comb: [UserId, UserId][] = [];

		for (let i = 0; i < users.length; i++) {
			for (let j = i + 1; j < users.length; j++) {
				comb.push([users[i], users[j]]);
			}
		}

		shuffle(comb);
		comb.forEach(shuffle);

		comb.forEach(([u1, u2]) => {
			const gameId = newUUID() as PongGameId;
			const g = new Pong(u1, u2);

			this.games.set(gameId, g);
		});
		this.currentGame = this.games.keys().next().value ?? null;
	}
}
