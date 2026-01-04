import { Socket } from 'socket.io-client';

export type UpdateInfo = {
	inQueue: number,
	totalUser: number,
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

export interface ClientToServer {
	enqueue: () => void;
	dequeue: () => void;
	debugInfo: () => void;
	gameMove: (up: GameMove) => void;
	connectedToGame: (gameId: string) => void;
	localGame: () => void,
};

export interface ServerToClient {
	forceDisconnect: (reason: string) => void;
	queueEvent: (msg: 'registered' | 'unregistered') => void;
	updateInformation: (info: UpdateInfo) => void,
	newGame: (initState: GameUpdate) => void,
	gameUpdate: (state: GameUpdate) => void,
	gameEnd: () => void;
};

export type SSocket = Socket<ClientToServer, ServerToClient>;
export type CSocket = Socket<ServerToClient, ClientToServer>;
