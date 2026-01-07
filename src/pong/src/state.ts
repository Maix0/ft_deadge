import { UserId } from '@shared/database/mixin/user';
import { newUUID } from '@shared/utils/uuid';
import { FastifyInstance } from 'fastify';
import { Pong } from './game';
import { GameMove, GameUpdate, SSocket } from './socket';
import { isNullish } from '@shared/utils';
import { PongGameId, PongGameOutcome } from '@shared/database/mixin/pong';
import https from 'https';

type PUser = {
	id: UserId;
	currentGame: null | GameId;
	socket: SSocket,
	windowId: string,
	updateInterval: NodeJS.Timeout,
};

type GameId = PongGameId;

class StateI {
	public static readonly UPDATE_INTERVAL_FRAMES: number = 60;

	private users: Map<UserId, PUser> = new Map();
	private queue: Set<UserId> = new Set();
	private queueInterval: NodeJS.Timeout;
	private games: Map<GameId, Pong> = new Map();

	public constructor(private fastify: FastifyInstance) {
		this.queueInterval = setInterval(() => this.queuerFunction());
		void this.queueInterval;
	}

	private static getGameUpdateData(id: GameId, g: Pong): GameUpdate {
		return {
			gameId: id,
			left: { id: g.userLeft, score: g.score[0], paddle: { x: g.leftPaddle.x, y: g.leftPaddle.y, width: g.leftPaddle.width, height: g.leftPaddle.height } },
			right: { id: g.userRight, score: g.score[1], paddle: { x: g.rightPaddle.x, y: g.rightPaddle.y, width: g.rightPaddle.width, height: g.rightPaddle.height } },
			ball: { x: g.ball.x, y: g.ball.y, size: g.ball.size },
			local: g.local,
		};
	}

	private queuerFunction(): void {
		const values = Array.from(this.queue.values());
		while (values.length >= 2) {
			const id1 = values.pop();
			const id2 = values.pop();

			if (isNullish(id1) || isNullish(id2)) {
				continue;
			}

			const u1 = this.users.get(id1);
			const u2 = this.users.get(id2);

			if (isNullish(u1) || isNullish(u2)) {
				continue;
			}
			this.queue.delete(id1);
			this.queue.delete(id2);

			const gameId = newUUID() as unknown as GameId;
			const g = new Pong(u1.id, u2.id);
			const iState: GameUpdate = StateI.getGameUpdateData(gameId, g);

			u1.socket.emit('newGame', iState);
			u2.socket.emit('newGame', iState);
			this.games.set(gameId, g);

			u1.currentGame = gameId;
			u2.currentGame = gameId;

			g.gameUpdate = setInterval(() => {
				g.tick();
				if (g.sendSig === false && g.ready_checks[0] === true && g.ready_checks[1] === true) {
					u1.socket.emit('rdyEnd');
					u2.socket.emit('rdyEnd');
					g.sendSig = true;
				}
				if (g.ready_checks[0] === true && g.ready_checks[1] === true) {
					this.gameUpdate(gameId, u1.socket);
					this.gameUpdate(gameId, u2.socket);
				}
				if (g.checkWinner() !== null) {this.cleanupGame(gameId, g); }
			}, 1000 / StateI.UPDATE_INTERVAL_FRAMES);
		}
	}

	private newLocalGame(sock: SSocket) {
		const user = this.users.get(sock.authUser.id);
		if (!user) return;

		const gameId = newUUID() as unknown as GameId;
		const g = Pong.makeLocal(user.id);
		const iState: GameUpdate = StateI.getGameUpdateData(gameId, g);

		user.socket.emit('newGame', iState);
		this.games.set(gameId, g);

		user.currentGame = gameId;

		g.gameUpdate = setInterval(() => {
			g.tick();
			this.gameUpdate(gameId, user.socket);
			if (g.sendSig === false) {
				user.socket.emit('rdyEnd');
				g.sendSig = true;
			}
			if (g.checkWinner() !== null) { this.cleanupGame(gameId, g); }
		}, 1000 / StateI.UPDATE_INTERVAL_FRAMES);

	}

	private gameUpdate(id: GameId, sock: SSocket) {
		// does the game we want to update the client exists ?
		if (!this.games.has(id)) return;
		// is the client someone we know ?
		if (!this.users.has(sock.authUser.id)) return;
		// is the client associated with that game ?
		if (this.users.get(sock.authUser.id)!.currentGame !== id) return;
		sock.emit('gameUpdate', StateI.getGameUpdateData(id, this.games.get(id)!));
	}

	private gameMove(socket: SSocket, u: GameMove) {
		// do we know this user ?
		if (!this.users.has(socket.authUser.id)) return;
		const user = this.users.get(socket.authUser.id)!;
		// does the user have a game and do we know such game ?
		if (user.currentGame === null || !this.games.has(user.currentGame)) return;
		const game = this.games.get(user.currentGame)!;

		if (game.local) {
			if (u.move !== null) { game.movePaddle('left', u.move); }
			if (u.moveRight !== null) { game.movePaddle('right', u.moveRight); }
		}
		else if (u.move !== null) { game.movePaddle(user.id, u.move); }
		game.updateLastSeen(user.id);
	}


	public registerUser(socket: SSocket): void {
		this.fastify.log.info('Registering new user');
		if (this.users.has(socket.authUser.id)) {
			socket.emit('forceDisconnect', 'Already Connected');
			socket.disconnect();
			return;
		}
		this.users.set(socket.authUser.id, {
			socket,
			id: socket.authUser.id,
			windowId: socket.id,
			updateInterval: setInterval(() => this.updateClient(socket), 3000),
			currentGame: null,
		});
		this.fastify.log.info('Registered new user');

		socket.on('disconnect', () => this.cleanupUser(socket));
		socket.on('enqueue', () => this.enqueueUser(socket));
		socket.on('dequeue', () => this.dequeueUser(socket));

		socket.on('readyUp', () => this.readyupUser(socket));
		socket.on('readyDown', () => this.readydownUser(socket));

		socket.on('gameMove', (e) => this.gameMove(socket, e));
		socket.on('localGame', () => this.newLocalGame(socket));
	}

	private updateClient(socket: SSocket): void {
		socket.emit('updateInformation', {
			inQueue: this.queue.size,
			totalUser: this.users.size,
			totalGames: this.games.size,
		});
	}

	private cleanupUser(socket: SSocket): void {
		if (!this.users.has(socket.authUser.id)) return;

		clearInterval(this.users.get(socket.authUser.id)?.updateInterval);
		this.users.delete(socket.authUser.id);
		this.queue.delete(socket.authUser.id);
	}

	private async cleanupGame(gameId: GameId, game: Pong): Promise<void> {
		let chat_text = 'A game ended between ';
		clearInterval(game.gameUpdate ?? undefined);
		this.games.delete(gameId);
		const winner = game.checkWinner() ?? 'left';
		let player: PUser | undefined = undefined;
		if ((player = this.users.get(game.userLeft)) !== undefined) {
			chat_text += player.id + ' and ';
			player.currentGame = null;
			player.socket.emit('gameEnd', winner);
		}
		if ((player = this.users.get(game.userRight)) !== undefined) {
			chat_text += player.id ;
			player.currentGame = null;
			player.socket.emit('gameEnd', winner);
		}
		const rOutcome = game.checkWinner();
		let outcome: PongGameOutcome = 'other';
		if (rOutcome === 'left') { outcome = 'winL'; }
		if (rOutcome === 'right') { outcome = 'winR'; }
		this.fastify.db.setPongGameOutcome(gameId, { id: game.userLeft, score: game.score[0] }, { id: game.userRight, score: game.score[1] }, outcome, game.local);
		this.fastify.log.info('SetGameOutcome !');
		if (!game.local) {
			let payload = {'nextGame':chat_text}; // TODO: add names of ppl
			try {
				const resp = await fetch("http://app-chat/api/chat/broadcast", {
					method:'POST',
					headers:{'Content-type':'application/json'},
					body: JSON.stringify(payload),
					});

				if (!resp.ok) {
					console.log(`fail :( ${resp}`);
					console.log('resp:'+resp.body);
					throw(resp);
				}
				else
					console.log("success");
			} catch (e : any) {
				console.log(`error gotten: ${e}`);
				throw (e);
			}
			// announce to chat
		}
	}


	private enqueueUser(socket: SSocket): void {
		if (!this.users.has(socket.authUser.id)) return;

		if (this.queue.has(socket.authUser.id)) return;

		if (this.users.get(socket.authUser.id)?.currentGame !== null) return;

		this.queue.add(socket.authUser.id);
		socket.emit('queueEvent', 'registered');
	}

	private dequeueUser(socket: SSocket): void {
		if (!this.users.has(socket.authUser.id)) return;

		if (!this.queue.has(socket.authUser.id)) return;

		this.queue.delete(socket.authUser.id);
		socket.emit('queueEvent', 'unregistered');
	}

	private readydownUser(socket: SSocket) : void {
		// do we know this user ?
		if (!this.users.has(socket.authUser.id)) return;
		const user = this.users.get(socket.authUser.id)!;
		// does the user have a game and do we know such game ?
		if (user.currentGame === null || !this.games.has(user.currentGame)) return;
		const game = this.games.get(user.currentGame)!;
		// is this a local game?
		if (game.local === true) return;
		game.readydown(user.id);
	}
	private readyupUser(socket: SSocket) : void {
		// do we know this user ?
		if (!this.users.has(socket.authUser.id)) return;
		const user = this.users.get(socket.authUser.id)!;
		// does the user have a game and do we know such game ?
		if (user.currentGame === null || !this.games.has(user.currentGame)) return;
		const game = this.games.get(user.currentGame)!;
		if (game.local === true) return;
		game.readyup(user.id);
	}

}

export let State: StateI = undefined as unknown as StateI;

export function newState(f: FastifyInstance) {
	State = new StateI(f);
}
