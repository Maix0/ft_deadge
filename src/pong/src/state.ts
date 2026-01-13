import { UserId } from '@shared/database/mixin/user';
import { newUUID } from '@shared/utils/uuid';
import { FastifyInstance } from 'fastify';
import { Pong } from './game';
import { GameMove, GameUpdate, JoinRes, SSocket, TourInfo } from './socket';
import { isNullish, shuffle } from '@shared/utils';
import { PongGameId, PongGameOutcome } from '@shared/database/mixin/pong';
import { Tournament } from './tour';

type PUser = {
	id: UserId;
	currentGame: null | GameId;
	socket: SSocket;
	windowId: string;
	updateInterval: NodeJS.Timeout;
	killSelfInterval: NodeJS.Timeout;
	lastSeen: number;
};

type GameId = PongGameId;

class StateI {
	public static readonly UPDATE_INTERVAL_FRAMES: number = 60;
	public static readonly KEEP_ALIVE_MS: number = 30 * 1000;
	public static readonly START_TIMER_TOURNAMENT: number = 60 * 2 * 1000;

	public users: Map<UserId, PUser> = new Map();
	public queue: Set<UserId> = new Set();
	public queueInterval: NodeJS.Timeout;
	public tournamentInterval: NodeJS.Timeout;
	public games: Map<GameId, Pong> = new Map();
	public tournament: Tournament | null = null;

	public constructor(public fastify: FastifyInstance) {
		this.queueInterval = setInterval(() => this.queuerFunction());
		this.tournamentInterval = setInterval(() =>
			this.tournamentIntervalFunc(),
		);
		void this.queueInterval;
		void this.tournamentInterval;
	}

	private static getGameUpdateData(id: GameId, g: Pong): GameUpdate {
		return {
			gameId: id,
			left: {
				id: g.userLeft,
				score: g.score[0],
				paddle: {
					x: g.leftPaddle.x,
					y: g.leftPaddle.y,
					width: g.leftPaddle.width,
					height: g.leftPaddle.height,
				},
			},
			right: {
				id: g.userRight,
				score: g.score[1],
				paddle: {
					x: g.rightPaddle.x,
					y: g.rightPaddle.y,
					width: g.rightPaddle.width,
					height: g.rightPaddle.height,
				},
			},
			ball: { x: g.ball.x, y: g.ball.y, size: g.ball.size },
			local: g.local,
		};
	}

	public initGame(
		g: Pong | null,
		gameId: GameId,
		id1: UserId,
		id2: UserId,
	): Pong | null {
		const u1 = this.users.get(id1);
		const u2 = this.users.get(id2);

		this.fastify.log.info({
			msg: 'init new game',
			user1: id1,
			user2: id2,
		});
		if (g === null) g = new Pong(id1, id2);
		const iState: GameUpdate = StateI.getGameUpdateData(gameId, g);

		u1?.socket.emit('newGame', iState);
		u2?.socket.emit('newGame', iState);
		g.rdy_timer = Date.now();
		this.games.set(gameId, g);

		if (u1) { u1.currentGame = gameId; }
		if (u2) { u2.currentGame = gameId; }

		g.gameUpdate = setInterval(() => {
			g.tick();
			if (
				g.sendSig === false &&
				g.ready_checks[0] === true &&
				g.ready_checks[1] === true
			) {
				if (u1) {
					u1.socket.emit('rdyEnd');
				}
				if (u2) {
					u2.socket.emit('rdyEnd');
				}
				g.sendSig = true;
			}
			if (g.ready_checks[0] === true && g.ready_checks[1] === true) {
				if (u1) {
					this.gameUpdate(gameId, u1.socket);
				}
				if (u2) {
					this.gameUpdate(gameId, u2.socket);
				}
			}
			if (g.checkWinner() !== null) {
				this.cleanupGame(gameId, g);
			}
		}, 1000 / StateI.UPDATE_INTERVAL_FRAMES);
		return g;
	}

	private getHello(socket: SSocket) {
		const user = this.users.get(socket.authUser.id);
		if (isNullish(user)) return;

		user.lastSeen = Date.now();
	}

	private registerForTournament(sock: SSocket, name: string | null) {
		const user = this.users.get(sock.authUser.id);
		if (isNullish(user)) return;

		if (isNullish(this.tournament)) {
			sock.emit('tournamentRegister', {
				kind: 'failure',
				msg: 'No tournament exists',
			});
			return;
		}
		if (this.tournament.state !== 'prestart') {
			sock.emit('tournamentRegister', {
				kind: 'failure',
				msg: 'No tournament already started',
			});
			return;
		}
		const udb = this.fastify.db.getUser(user.id);
		if (isNullish(udb)) {
			sock.emit('tournamentRegister', {
				kind: 'failure',
				msg: 'User not found',
			});
			return;
		}

		this.tournament.addUser(user.id, name ?? udb.name);
		sock.emit('tournamentRegister', {
			kind: 'success',
			msg: 'Registered to Tournament',
		});
		return;
	}

	private unregisterForTournament(sock: SSocket) {
		const user = this.users.get(sock.authUser.id);
		if (isNullish(user)) return;

		if (isNullish(this.tournament)) {
			sock.emit('tournamentRegister', {
				kind: 'failure',
				msg: 'No tournament exists',
			});
			return;
		}
		if (this.tournament.state !== 'prestart') {
			sock.emit('tournamentRegister', {
				kind: 'failure',
				msg: 'No tournament already started',
			});
			return;
		}

		this.tournament.removeUser(user.id);
		sock.emit('tournamentRegister', {
			kind: 'success',
			msg: 'Unregistered to Tournament',
		});
		return;
	}

	private createTournament(sock: SSocket) {
		const user = this.users.get(sock.authUser.id);
		if (isNullish(user)) return;

		if (this.tournament !== null) {
			sock.emit('tournamentCreateMsg', {
				kind: 'failure',
				msg: 'A tournament already exists',
			});
			return;
		}

		this.tournament = new Tournament(user.id);
		this.registerForTournament(sock, null);
		this.tournament.startTimeout = setTimeout(
			() => this.tournament?.start(),
			StateI.START_TIMER_TOURNAMENT,
		);
	}

	private cleanupTournament() {
		if (this.tournament === null) return;
		if (this.tournament.state === 'ended') { this.fastify.db.createNewTournamentById(this.tournament.owner, this.tournament.users.values().toArray(), this.tournament.games); }
		this.tournament = null;
		this.fastify.log.info('Tournament has been ended');
	}

	private startTournament(sock: SSocket) {
		if (isNullish(this.tournament)) return;
		const user = this.users.get(sock.authUser.id);
		if (isNullish(user)) return;
		if (user.id !== this.tournament.owner) return;

		clearInterval(this.tournament.startTimeout);
		this.tournament.start();
	}

	public newPausedGame(suid1: string, suid2: string): GameId | undefined {
		this.fastify.log.info('new game request: suid1: ' + suid1 + '\tsuid2: ' + suid2);
		if (!this.fastify.db.getUser(suid1) || !this.fastify.db.getUser(suid2)) { return undefined; }
		this.fastify.log.info('new paused start');
		const uid1: UserId = suid1 as UserId;
		const uid2: UserId = suid2 as UserId;
		const g = new Pong(uid1, uid2);
		g.rdy_timer = -1;
		const gameId = newUUID() as unknown as GameId;

		this.games.set(gameId, g);
		this.fastify.log.info('new paused game \'' + gameId + '\'');
		return gameId;
	}

	private tournamentIntervalFunc() {
		const broadcastTourEnding = (msg: string) => {
			this.users.forEach((u) => {
				u.socket.emit('tourEnding', msg);
			});
		};
		if (this.tournament) {
			if (this.tournament.state === 'canceled') {
				broadcastTourEnding('Tournament was canceled');
				this.cleanupTournament();
			}
			else if (this.tournament.state === 'ended') {
				broadcastTourEnding('Tournament is finished !');
				this.cleanupTournament();
			}
			else if (this.tournament.state === 'playing') {
				const currentgame = this.tournament.currentGame;
				if (currentgame) {
					const game = this.games.get(currentgame);
					if (game) {
						const gameData = StateI.getGameUpdateData(
							currentgame,
							game,
						);
						for (const user of this.tournament.users
							.keys()
							.map((id) => this.users.get(id))
							.filter((v) => !isNullish(v))) {
							user.socket.emit('gameUpdate', gameData);
						}
					}
				}
				else {
					this.fastify.log.warn('NO NEXT GAME ?');
				}
			}
		}
	}

	private queuerFunction(): void {
		const values = Array.from(this.queue.values());
		shuffle(values);
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
			this.initGame(null, gameId, u1.id, u2.id);
		}
	}

	private newLocalGame(sock: SSocket) {
		const user = this.users.get(sock.authUser.id);
		if (!user) return;

		if (this.tournament && this.tournament.users.has(sock.authUser.id)) return;

		const gameId = newUUID() as unknown as GameId;
		const g = Pong.makeLocal(user.id);
		const iState: GameUpdate = StateI.getGameUpdateData(gameId, g);

		user.socket.emit('newGame', iState);
		this.games.set(gameId, g);

		user.currentGame = gameId;
		// here we dont use this.initGame because we are in a local game...
		g.gameUpdate = setInterval(() => {
			g.tick();
			this.gameUpdate(gameId, user.socket);
			if (g.sendSig === false) {
				user.socket.emit('rdyEnd');
				g.sendSig = true;
			}
			if (g.checkWinner() !== null) {
				this.cleanupGame(gameId, g);
			}
		}, 1000 / StateI.UPDATE_INTERVAL_FRAMES);
	}

	private gameUpdate(id: GameId, sock: SSocket) {
		// does the game we want to update the client exists ?
		if (!this.games.has(id)) return;
		// is the client someone we know ?
		if (!this.users.has(sock.authUser.id)) return;
		// is the client associated with that game ?
		if (this.users.get(sock.authUser.id)!.currentGame !== id) return;
		sock.emit(
			'gameUpdate',
			StateI.getGameUpdateData(id, this.games.get(id)!),
		);
	}

	private gameMove(socket: SSocket, u: GameMove) {
		// do we know this user ?
		if (!this.users.has(socket.authUser.id)) return;
		const user = this.users.get(socket.authUser.id)!;
		// does the user have a game and do we know such game ?
		if (user.currentGame === null || !this.games.has(user.currentGame)) {
			return;
		}
		const game = this.games.get(user.currentGame)!;

		if (game.local) {
			if (u.move !== null) {
				game.movePaddle('left', u.move);
			}
			if (u.moveRight !== null) {
				game.movePaddle('right', u.moveRight);
			}
		}
		else if (u.move !== null) {
			game.movePaddle(user.id, u.move);
		}
		game.updateLastSeen(user.id);
	}

	public checkKillSelf(sock: SSocket) {
		const user = this.users.get(sock.authUser.id);
		if (isNullish(user)) return;

		if (Date.now() - user.lastSeen < StateI.KEEP_ALIVE_MS) return;

		this.cleanupUser(sock);
	}

	private tryJoinGame(g_id: string, sock: SSocket): JoinRes {
		const game_id: PongGameId = g_id as PongGameId;

		if (this.games.has(game_id) === false) {
			this.fastify.log.warn('gameId:' + g_id + ' is unknown!');
			return (JoinRes.no);
		}
		const game: Pong = this.games.get(game_id)!;
		if (game.local === true || (game.userLeft !== sock.authUser.id && game.userRight !== sock.authUser.id)) {
			this.fastify.log.warn('user trying to connect to a game he\'s not part of: gameId:' + g_id + ' userId:' + sock.authUser.id);
			return (JoinRes.no);
		}
		game.userOnPage[game.userLeft === sock.authUser.id ? 0 : 1] = true;
		if (game.userOnPage[0] === game.userOnPage[1]) {
			this.fastify.log.info('Paused game start: gameId:' + g_id);
			this.initGame(game, game_id, game.userLeft, game.userRight);
		}
		return (JoinRes.yes);
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
			updateInterval: setInterval(() => this.updateClient(socket), 100),
			killSelfInterval: setInterval(
				() => this.checkKillSelf(socket),
				100,
			),
			currentGame: null,
			lastSeen: Date.now(),
		});
		this.fastify.log.info('Registered new user');

		socket.on('disconnect', () => this.cleanupUser(socket));
		socket.on('enqueue', () => this.enqueueUser(socket));
		socket.on('dequeue', () => this.dequeueUser(socket));

		socket.on('readyUp', () => this.readyupUser(socket));
		socket.on('readyDown', () => this.readydownUser(socket));

		socket.on('gameMove', (e) => this.gameMove(socket, e));
		socket.on('localGame', () => this.newLocalGame(socket));
		socket.on('joinGame', (g_id, ack) => { return (ack(this.tryJoinGame(g_id, socket))); });
		// todo: allow passing nickname
		socket.on('tourRegister', () =>
			this.registerForTournament(socket, null),
		);
		socket.on('tourUnregister', () => this.unregisterForTournament(socket));

		socket.on('tourCreate', () => this.createTournament(socket));
		socket.on('tourStart', () => this.startTournament(socket));
		socket.on('hello', () => this.getHello(socket));
	}

	private updateClient(socket: SSocket): void {
		socket.emit('updateInformation', {
			inQueue: this.queue.size,
			totalUser: this.users.size,
			totalGames: this.games.size,
		});
		let tourInfo: TourInfo | null = null;
		if (this.tournament !== null) {
			tourInfo = {
				ownerId: this.tournament.owner,
				state: this.tournament.state,
				players: this.tournament.users.values().toArray(),
				remainingMatches:
					this.tournament.state === 'playing'
						? this.tournament.matchup.length
						: null,
			};
		}
		socket.emit('tournamentInfo', tourInfo);
	}

	private cleanupUser(socket: SSocket): void {
		if (!this.users.has(socket.authUser.id)) return;

		clearInterval(this.users.get(socket.authUser.id)?.updateInterval);
		clearInterval(this.users.get(socket.authUser.id)?.killSelfInterval);
		this.users.delete(socket.authUser.id);
		this.queue.delete(socket.authUser.id);

		// if the user is in the tournament, and the tournament owner isn't the owner => we remove the user from the tournament !
		if (
			this.tournament?.users.has(socket.authUser.id) &&
			this.tournament?.owner !== socket.authUser.id
		) {
			this.tournament.removeUser(socket.authUser.id);
		}
	}

	private async cleanupGame(gameId: GameId, game: Pong): Promise<void> {
		let chat_text = 'A game ended between ';
		clearInterval(game.gameUpdate ?? undefined);
		if (game.onEnd) game.onEnd();
		this.games.delete(gameId);
		const winner = game.checkWinner() ?? 'left';
		let player: PUser | undefined = undefined;
		if ((player = this.users.get(game.userLeft)) !== undefined) {
			player.currentGame = null;
			player.socket.emit('gameEnd', winner);
		}
		chat_text +=
			(this.fastify.db.getUser(game.userLeft)?.name ?? game.userLeft) +
			' and ';
		if ((player = this.users.get(game.userRight)) !== undefined) {
			player.currentGame = null;
			player.socket.emit('gameEnd', winner);
		}
		chat_text +=
			this.fastify.db.getUser(game.userRight)?.name ?? game.userRight;
		const rOutcome = game.checkWinner();
		let outcome: PongGameOutcome = 'other';
		if (rOutcome === 'left') {
			outcome = 'winL';
		}
		if (rOutcome === 'right') {
			outcome = 'winR';
		}
		this.fastify.db.setPongGameOutcome(
			gameId,
			{ id: game.userLeft, score: game.score[0] },
			{ id: game.userRight, score: game.score[1] },
			outcome,
			game.local,
		);
		this.fastify.log.info('SetGameOutcome !');
		if (!game.local) {
			const payload = { nextGame: chat_text };
			try {
				const resp = await fetch('http://app-chat/api/chat/broadcast', {
					method: 'POST',
					headers: { 'Content-type': 'application/json' },
					body: JSON.stringify(payload),
				});

				if (!resp.ok) {
					throw resp;
				}
				else {
					this.fastify.log.info('game-end info to chat success');
				}
			}
			catch (e: unknown) {
				this.fastify.log.error(`game-end info to chat failed: ${e}`);
			}
		}
	}

	private enqueueUser(socket: SSocket): void {
		if (!this.users.has(socket.authUser.id)) return;

		if (this.queue.has(socket.authUser.id)) return;

		if (this.users.get(socket.authUser.id)?.currentGame !== null) return;

		if (this.tournament && this.tournament.users.has(socket.authUser.id)) return;

		this.queue.add(socket.authUser.id);
		socket.emit('queueEvent', 'registered');
	}

	private dequeueUser(socket: SSocket): void {
		if (!this.users.has(socket.authUser.id)) return;

		if (!this.queue.has(socket.authUser.id)) return;

		this.queue.delete(socket.authUser.id);
		socket.emit('queueEvent', 'unregistered');
	}

	private readydownUser(socket: SSocket): void {
		// do we know this user ?
		if (!this.users.has(socket.authUser.id)) return;
		const user = this.users.get(socket.authUser.id)!;
		// does the user have a game and do we know such game ?
		if (user.currentGame === null || !this.games.has(user.currentGame)) {
			return;
		}
		const game = this.games.get(user.currentGame)!;
		// is this a local game?
		if (game.local === true) return;
		game.readydown(user.id);
	}
	private readyupUser(socket: SSocket): void {
		// do we know this user ?
		if (!this.users.has(socket.authUser.id)) return;
		const user = this.users.get(socket.authUser.id)!;
		// does the user have a game and do we know such game ?
		if (user.currentGame === null || !this.games.has(user.currentGame)) {
			return;
		}
		const game = this.games.get(user.currentGame)!;
		if (game.local === true) return;
		game.readyup(user.id);
	}
}

export let State: StateI = undefined as unknown as StateI;

export function newState(f: FastifyInstance) {
	State = new StateI(f);
}
