import {UserId} from '@shared/database/mixin/user';
import {FastifyInstance} from 'fastify';
import {GameMove, SSocket} from './socket';
import {isNullish} from '@shared/utils';
import {newUUID} from '@shared/utils/uuid';
import {GameId} from '@shared/database/mixin/tictactoe';
import {TTC} from './game';

type TTTUser = {
    socket: SSocket,
    userId: UserId,
    windowId: string,
    updateInterval: NodeJS.Timeout,
    currentGame: GameId | null,
}

export class StateI {
    private users: Map<UserId, TTTUser> = new Map();

    private queue: Set<UserId> = new Set();

    private queueInterval: NodeJS.Timeout;

    private games: Map<GameId, TTC> = new Map();

    constructor(private fastify: FastifyInstance) {
        this.queueInterval = setInterval(() => this.queuerFunction());
        void this.queueInterval;
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
            userId: socket.authUser.id,
            windowId: socket.id,
            updateInterval: setInterval(() => this.updateClient(socket), 3000),
            currentGame: null,
        });
        this.fastify.log.info('Registered new user');

        socket.on('disconnect', () => this.cleanupUser(socket));
        socket.on('enqueue', () => this.enqueueUser(socket));
        socket.on('dequeue', () => this.dequeueUser(socket));
        socket.on('debugInfo', () => this.debugSocket(socket));

        socket.on('gameMove', (e) => this.gameMove(socket, e));
        if (socket) {
            console.log('Socket:', socket.id);
        }

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
            const g = new TTC(u1.userId, u2.userId);
            const iState = {
                boardState: g.board,
                currentPlayer: g.getCurrentState(),
                playerX: g.playerX,
                playerO: g.playerO,
                gameState: g.checkState(),
                gameId: gameId,
            };

            u1.socket.emit('newGame', iState);
            u2.socket.emit('newGame', iState);
            this.games.set(gameId, g);

            u1.currentGame = gameId;
            u2.currentGame = gameId;

            g.gameUpdate = setInterval(() => {
                this.gameUpdate(gameId, u1.socket);
                this.gameUpdate(gameId, u2.socket);
                if (g.checkState() !== 'ongoing') {
                    this.cleanupGame(gameId, g);
                    this.fastify.db.setGameOutcome(gameId, u1.userId, u2.userId, g.checkState());
                }
            }, 100);
        }
    }

    private updateClient(socket: SSocket): void {
        socket.emit('updateInformation', {
            inQueue: this.queue.size,
            totalUser: this.users.size,
        });
    }

    private cleanupUser(socket: SSocket): void {
        if (!this.users.has(socket.authUser.id)) return;

        clearInterval(this.users.get(socket.authUser.id)?.updateInterval);
        this.users.delete(socket.authUser.id);
        this.queue.delete(socket.authUser.id);
    }

    private cleanupGame(gameId: GameId, game: TTC): void {
        clearInterval(game.gameUpdate ?? undefined);
        this.games.delete(gameId);
        let player: TTTUser | undefined;
        if ((player = this.users.get(game.playerO)) !== undefined) {
            player.currentGame = null;
            player.socket.emit('gameEnd');
        }
        if ((player = this.users.get(game.playerX)) !== undefined) {
            player.currentGame = null;
            player.socket.emit('gameEnd');
        }
        // do something here with the game result before deleting the game at the end
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

    private debugSocket(socket: SSocket): void {
        console.log(({
            message: `socket debug for ${socket.id}`,
            userid: socket.authUser.id,
            queue: this.queue,
            users: this.users,
        }));
    }

    private gameUpdate(gameId: GameId, socket: SSocket): void {
        if (!this.users.has(socket.authUser.id)) return;
        const user = this.users.get(socket.authUser.id)!;

        if (user.currentGame !== gameId || !this.games.has(user.currentGame)) return;

        const games = this.games.get(gameId)!;

        socket.emit('gameBoard', {
            boardState: games.board,
            currentPlayer: games.getCurrentState(),
            playerX: games.playerX,
            playerO: games.playerO,
            gameState: games.checkState(),
            gameId: gameId,
        });
    }

    private gameMove(socket: SSocket, update: GameMove) {
        if (!this.users.has(socket.authUser.id)) return 'unknownError';
        const user = this.users.get(socket.authUser.id)!;

        if (user.currentGame !== null && !this.games.has(user.currentGame)) return 'unknownError';
        const game = this.games.get(user.currentGame!)!;

        game.makeMove(socket.authUser.id, update.index);
    }
}

// this value will be overriten
export let State: StateI = undefined as unknown as StateI;

export function createState(fastify: FastifyInstance) {
    if (State !== undefined) {
        throw new Error('State was already created !!!!');
    }
    State = new StateI(fastify);
}


export default State;

