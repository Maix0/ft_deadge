import { PongGameId } from '@shared/database/mixin/pong';
import { UserId } from '@shared/database/mixin/user';
import { isNullish, shuffle } from '@shared/utils';
import { newUUID } from '@shared/utils/uuid';
import { State } from './state';

type TourUser = {
	id: UserId;
	score: number;
	name: string;
};

type TournamentState = 'prestart' | 'playing' | 'ended' | 'canceled';
export class Tournament {
	public users: Map<UserId, TourUser> = new Map();
	public currentGame: PongGameId | null = null;
	public matchup: [UserId, UserId][] = [];
	public state: TournamentState = 'prestart';
	public startTimeout: NodeJS.Timeout | undefined;
	public games: PongGameId[] = [];

	constructor(public owner: UserId) {
		State.broadcastTourStatus('A new Tournament has been created');
	}

	public addUser(id: UserId, name: string) {
		if (this.state !== 'prestart') return;
		this.users.set(id, { id, name, score: 0 });
	}

	public removeUser(id: UserId) {
		if (this.state !== 'prestart') return;
		this.users.delete(id);
	}

	public start() {
		if (this.state !== 'prestart') return;
		if (this.users.size < 2) {
			this.state = 'canceled';
			State.broadcastTourStatus('The tournament has been canceled !');
			return;
		}
		this.state = 'playing';
		const users = Array.from(this.users.keys());
		const comb: [UserId, UserId][] = [];

		for (let i = 0; i < users.length; i++) {
			for (let j = i + 1; j < users.length; j++) {
				comb.push([users[i], users[j]]);
			}
		}

		shuffle(comb);
		comb.forEach(shuffle);
		const result: [UserId, UserId][] = [];

		comb.forEach(([u1, u2]) => { result.push([u1, u2]); });
		this.matchup = result;
		this.setupNextGame();
		State.broadcastTourStatus('The tournament Started !');
	}

	private setupNextGame() {
		if (this.matchup.length > 0) {
			const matchup = this.matchup.shift() ?? null;
			if (matchup == null) {
				this.state = 'ended';
				return;
			}
			const [u1, u2] = matchup;
			const gameId = newUUID() as PongGameId;
			const game = State.initGame(null, gameId, u1, u2);
			State.broadcastTourStatus(`A Tournament game between ${this.users.get(u1)?.name ?? 'the left player'} and ${this.users.get(u2)?.name ?? 'the right player'} will start ASAP`);
			if (game) {
				game.onEnd = () => this.gameEnd();
			}
			this.currentGame = gameId;
			this.games.push(gameId);
		}
		else {
			this.state = 'ended';
		}
		if (this.currentGame === null) { this.state = 'ended'; }
	}

	public gameEnd() {
		if (!isNullish(this.currentGame)) {
			const game = State.games.get(this.currentGame);
			if (game) {
				const winner = game.checkWinner();
				const winnerId = winner === 'left' ? game.userLeft : game.userRight;

				const u = this.users.get(winnerId);
				if (u) { this.users.set(winnerId, { id: u.id, name: u.name, score: u.score + 1 }); }
				for (const user of this.users
					.keys()
					.map((id) => State.users.get(id))
					.filter((v) => !isNullish(v))) {
					user.socket.emit('gameEnd', winner!);
				}
			}
		}
		setTimeout(() => this.setupNextGame(), 3100);
	}
}
