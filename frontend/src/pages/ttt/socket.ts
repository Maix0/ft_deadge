import { Socket } from 'socket.io-client';

export type UpdateInfo = {
	inQueue: number,
	totalUser: number,
}
export type CellState = 'X' | 'O' | null;

export type GameUpdate = {
	gameId: string;

	playerX: string;
	playerO: string;

	boardState: CellState[];
	currentPlayer: 'X' | 'O';
	gameState: 'winX' | 'winO' | 'draw' | 'ongoing' | 'other';
}

export type GameMove = {
	index: number;
}

export interface ClientToServer {
	enqueue: () => void;
	dequeue: () => void;
	debugInfo: () => void;
	gameMove: (up: GameMove) => void;
	keepalive: () => void;
	connectedToGame: (gameId: string) => void;
};

export interface ServerToClient {
	forceDisconnect: (reason: string) => void;
	queueEvent: (msg: 'registered' | 'unregistered') => void;
	updateInformation: (info: UpdateInfo) => void,
	newGame: (initState: GameUpdate) => void,
	gameBoard: (state: GameUpdate) => void,
	gameEnd: () => void;
};

export type SSocket = Socket<ClientToServer, ServerToClient>;
export type CSocket = Socket<ServerToClient, ClientToServer>;
