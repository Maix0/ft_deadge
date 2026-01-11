import { Socket } from 'socket.io';

export type UpdateInfo = {
	inQueue: number;
	totalUser: number;
	totalGames: number;
};

export type PaddleData = {
	x: number;
	y: number;

	width: number;
	height: number;
};

export type GameUpdate = {
	gameId: string;

	left: { id: string; paddle: PaddleData; score: number };
	right: { id: string; paddle: PaddleData; score: number };

	ball: { x: number; y: number; size: number };
	local: boolean;
};

export type GameMove = {
	move: 'up' | 'down' | null;
	// only used in local games
	moveRight: 'up' | 'down' | null;
};

export type TourInfo = {
	ownerId: string;
	state: 'prestart' | 'playing' | 'ended' | 'canceled';
	players: { id: string; name: string; score: number }[];
	remainingMatches: number | null,
};

export enum JoinRes {
	yes = 'yes',
	no = 'dont ever talk to me or my kid ever again',
	dev = 'yaaaaaaaaaaaaaaaaaaaaaaaa',
};

export interface ClientToServer {
	enqueue: () => void;
	dequeue: () => void;
	readyUp: () => void;
	readyDown: () => void;
	gameMove: (up: GameMove) => void;
	connectedToGame: (gameId: string) => void;
	localGame: () => void;

	joinGame: (guid : string, ack:(result:JoinRes) => void) => void;

	hello: () => void;

	// TOURNAMENT

	tourRegister: () => void;
	tourUnregister: () => void;

	tourCreate: () => void;
	tourStart: () => void;
}

export interface ServerToClient {
	forceDisconnect: (reason: string) => void;
	queueEvent: (msg: 'registered' | 'unregistered') => void;
	rdyEnd: () => void;
	updateInformation: (info: UpdateInfo) => void;
	newGame: (initState: GameUpdate) => void;
	gameUpdate: (state: GameUpdate) => void;
	gameEnd: (winner: 'left' | 'right') => void;

	// TOURNAMENT
	tournamentRegister: (res: {
		kind: 'success' | 'failure';
		msg?: string;
	}) => void;
	tournamentCreateMsg: (res: {
		kind: 'success' | 'failure';
		msg?: string;
	}) => void;
	tournamentInfo: (info: TourInfo | null) => void;

	tourEnding: (msg: string) => void;
}

export type SSocket = Socket<ClientToServer, ServerToClient>;
export type CSocket = Socket<ServerToClient, ClientToServer>;
