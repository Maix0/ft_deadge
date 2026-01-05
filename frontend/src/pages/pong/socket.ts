import { Socket } from 'socket.io-client';

export type UpdateInfo = {
	inQueue: number,
	totalUser: number,
	totalGames : number
}

export type PaddleData = {
	x: number,
	y: number,

	width: number,
	height: number,
};

export type GameUpdate = {
	gameId: string;

	left: { id: string, paddle: PaddleData, score: number };
	right: { id: string, paddle: PaddleData, score: number };

	ball: { x: number, y: number, size: number };
	local: boolean,
}

export type GameMove = {
	move: 'up' | 'down' | null,
	// only used in local games
	moveRight: 'up' | 'down' | null,
}

// TODO: add new evt such as "local play", "ready-up" see: ./pong.ts
export interface ClientToServer {
	enqueue: () => void;
	dequeue: () => void;
	readyUp: () => void;
	readyDown:() => void;
	debugInfo: () => void;
	gameMove: (up: GameMove) => void;
	connectedToGame: (gameId: string) => void;
	localGame: () => void,
};

export interface ServerToClient {
	forceDisconnect: (reason: string) => void;
	queueEvent: (msg: 'registered' | 'unregistered') => void;
	updateInformation: (info: UpdateInfo) => void,
	newGame: (initState: GameUpdate) => void, // <- consider this the gameProc eg not start of game but wait for client to "ready up"
	gameUpdate: (state: GameUpdate) => void,
	gameEnd: () => void;
};

export type SSocket = Socket<ClientToServer, ServerToClient>;
export type CSocket = Socket<ServerToClient, ClientToServer>;
