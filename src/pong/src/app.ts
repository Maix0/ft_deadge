import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fastifyFormBody from '@fastify/formbody';
import fastifyMultipart from '@fastify/multipart';
import * as db from '@shared/database';
import * as auth from '@shared/auth';
import * as swagger from '@shared/swagger';
import * as utils from '@shared/utils';
import { Server, Socket } from 'socket.io';
import { broadcast } from './broadcast';
import type { ClientProfil, ClientMessage } from './chat_types';
import { sendInvite } from './sendInvite';
import { setGameLink } from './setGameLink';
import { UserId } from '@shared/database/mixin/user';

// colors for console.log
export const color = {
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	reset: '\x1b[0m',
};

declare const __SERVICE_NAME: string;

// Global map of clients
// key = socket, value = clientname
interface ClientInfo {
	user: string;
	lastSeen: number;
}

export const clientChat = new Map<string, ClientInfo>();

// @ts-expect-error: import.meta.glob is a vite thing. Typescript doesn't know this...
const plugins = import.meta.glob('./plugins/**/*.ts', { eager: true });
// @ts-expect-error: import.meta.glob is a vite thing. Typescript doesn't know this...
const routes = import.meta.glob('./routes/**/*.ts', { eager: true });

const app: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	void opts;

	await fastify.register(utils.useMonitoring);
	await fastify.register(utils.useMakeResponse);
	await fastify.register(swagger.useSwagger, { service: __SERVICE_NAME });
	await fastify.register(db.useDatabase as FastifyPluginAsync, {});
	await fastify.register(auth.jwtPlugin as FastifyPluginAsync, {});
	await fastify.register(auth.authPlugin as FastifyPluginAsync, {});

	// Place here your custom code!
	for (const plugin of Object.values(plugins)) {
		void fastify.register(plugin as FastifyPluginAsync, {});
	}
	for (const route of Object.values(routes)) {
		void fastify.register(route as FastifyPluginAsync, {});
	}

	void fastify.register(fastifyFormBody, {});
	void fastify.register(fastifyMultipart, {});

	fastify.ready((err) => {
		if (err) throw err;
		onReady(fastify);
	});
};
export default app;
export { app };

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
	interface FastifyInstance {
		io: Server<{
			inviteGame: (data: ClientProfil) => void;
			message: (msg: string) => void;
			batmove_Left: (direction: 'up' | 'down') => void;
			batmove_Right: (direction: 'up' | 'down') => void;
			batLeft_update: (y: number) => void;
			batRight_update: (y: number) => void;
			ballPos_update: (x: number, y: number) => void;
			MsgObjectServer: (data: { message: ClientMessage }) => void;
			queuJoin: (userID: UserId) => void;
		}>;
	}
}

function isInRange(x: number, low: number, high: number) {
	if (x >= low && x <= high) return true;
	return false;
}

async function sendScore(
	socket: Socket,
	scoreLeft: number,
	scoreRight: number,
) {
	// idk why, sometimes... it fails?
	const msg: ClientMessage = {
		destination: 'score-info',
		command: '',
		user: '',
		text: scoreLeft.toString() + ':' + scoreRight.toString(),
		SenderWindowID: '',
	};

	socket.emit('MsgObjectServer', { message: msg });
}

async function onReady(fastify: FastifyInstance) {
	// shows address for connection au server transcendance
	const session = process.env.SESSION_MANAGER ?? '';
	if (session) {
		const part = session.split('/')[1];
		const machineName = part.split('.')[0];
		console.log(
			color.yellow,
			'Connect at : https://' + machineName + ':8888/app/login',
		);
	}

	// DRAW AREA
	// top edge of the field
	const TOP_EDGE = 0;
	// bottom edge of the field;
	const BOTTOM_EDGE = 450;
	const LEFT_EDGE = 0;
	const RIGHT_EDGE = 800;

	void LEFT_EDGE;

	// PADDLEs
	const PADDLE_HEIGHT = 80;
	const PADDLE_WIDTH = 12;

	const PADDLE_SPEED = 20;
	const PADDLE_X_OFFSET = 4;

	// 370
	const MAX_PADDLE_Y = BOTTOM_EDGE - PADDLE_HEIGHT;
	// 185
	const PADDLE_START = BOTTOM_EDGE / 2 - PADDLE_HEIGHT / 2;

	// BALL
	// widht times 2 bc rounded on moth sides + 4 for border
	const BALL_SIZE = 8 * 2 + 4;
	const START_BALLX = RIGHT_EDGE / 2 - BALL_SIZE;
	const START_BALLY = BOTTOM_EDGE / 2 - BALL_SIZE;

	const ACCELERATION_FACTOR = 1.15;
	const ABS_MAX_BALL_SPEED = 3;

	// val inits
	// shared start bat position
	let paddleLeft = PADDLE_START;
	// shared start bat position
	let paddleRight = PADDLE_START;

	let ballPosX = START_BALLX;
	let ballPosY = START_BALLY;
	let ballSpeedX = -1;
	let ballSpeedY = -1;
	let scoreL = 0;
	let scoreR = 0;

	//  uuid, game uid - if not in game empty string
	const games: Record<UserId, string> = {};

	fastify.io.on('connection', (socket: Socket) => {
		socket.emit('batLeft_update', paddleLeft);
		socket.emit('batRight_update', paddleRight);
		socket.emit('ballPos_update', ballPosX, ballPosY);
		sendScore(socket, scoreL, scoreR);

		// GAME
		// paddle handling
		socket.on('batmove_Left', (direction: 'up' | 'down') => {
			if (direction === 'up') {
				paddleLeft -= PADDLE_SPEED;
			}
			if (direction === 'down') {
				paddleLeft += PADDLE_SPEED;
			}
			// position of bat leftplokoplpl
			paddleLeft = Math.max(TOP_EDGE, Math.min(MAX_PADDLE_Y, paddleLeft));
			console.log('batLeft_update:', paddleLeft);
			socket.emit('batLeft_update', paddleLeft);
		});
		socket.on('batmove_Right', (direction: 'up' | 'down') => {
			if (direction === 'up') {
				paddleRight -= PADDLE_SPEED;
			}
			if (direction === 'down') {
				paddleRight += PADDLE_SPEED;
			}
			// position of bat left
			paddleRight = Math.max(
				TOP_EDGE,
				Math.min(MAX_PADDLE_Y, paddleRight),
			);
			socket.emit('batRight_update', paddleRight);
		});
		// ball handling:
		setInterval(async () => {
			const new_ballPosX = ballPosX + ballSpeedX;
			const new_ballPosY = ballPosY + ballSpeedY;

			if (
				((isInRange(
					new_ballPosY,
					paddleLeft,
					paddleLeft + PADDLE_HEIGHT,
				) ||
					isInRange(
						new_ballPosY + BALL_SIZE * 2,
						paddleLeft,
						paddleLeft + PADDLE_HEIGHT,
					)) &&
					// y ok ?
					isInRange(
						new_ballPosX,
						PADDLE_X_OFFSET,
						PADDLE_X_OFFSET + PADDLE_WIDTH,
					) &&
					ballSpeedX < 0) ||
				// x ok? && ball going toward paddle?
				((isInRange(
					new_ballPosY,
					paddleRight,
					paddleRight + PADDLE_HEIGHT,
				) ||
					isInRange(
						new_ballPosY + BALL_SIZE * 2,
						paddleRight,
						paddleRight + PADDLE_HEIGHT,
					)) &&
					// right side equations
					isInRange(
						new_ballPosX + BALL_SIZE * 2,
						RIGHT_EDGE - PADDLE_X_OFFSET - PADDLE_WIDTH,
						RIGHT_EDGE - PADDLE_X_OFFSET,
					) &&
					ballSpeedX > 0)
			) {
				ballSpeedX *= -1;
				ballSpeedX *= ACCELERATION_FACTOR;
				ballSpeedY *= ACCELERATION_FACTOR;
				console.log('bat colision');
			}
			else if (
				new_ballPosX < 0 ||
				new_ballPosX + BALL_SIZE * 2 > RIGHT_EDGE
			) {
				ballPosX = START_BALLX;
				ballPosY = START_BALLY;
				ballSpeedX = Math.random() - 0.5 < 0 ? -1 : 1;

				if (new_ballPosX < 0) {
					scoreR += 1;
					ballSpeedY = -1;
				}
				else {
					scoreL += 1;
					ballSpeedY = 1;
				}
				if (scoreL >= 5 || scoreR >= 5) {
					console.log('game should stop + board reset');
					// temp solution
					ballSpeedX = 0;
					ballSpeedY = 0;
					// reset board :D
				}
				console.log('point scored');
				sendScore(socket, scoreL, scoreR);
				// TODO: score point + 	ball reset + spd reset
			}
			else if (
				new_ballPosY < 0 ||
				new_ballPosY + BALL_SIZE * 2 > BOTTOM_EDGE
			) {
				ballSpeedY *= -1;
				ballSpeedX *= ACCELERATION_FACTOR;
				ballSpeedY *= ACCELERATION_FACTOR;
			}
			ballSpeedX = Math.max(
				-ABS_MAX_BALL_SPEED,
				Math.min(ballSpeedX, ABS_MAX_BALL_SPEED),
			);
			ballSpeedY = Math.max(
				-ABS_MAX_BALL_SPEED,
				Math.min(ballSpeedY, ABS_MAX_BALL_SPEED),
			);

			ballPosX += ballSpeedX;
			ballPosY += ballSpeedY;

			socket.emit('ballPos_update', ballPosX, ballPosY);
		}, 16);

		// QUEUE HANDL
		socket.on('queuJoin', async (uuid: UserId) => {
			console.log('queu join recieved for : ', uuid);
			if (!(uuid in games.hasOwnProperty)) {
				console.log('new user in game search queu');
				games[uuid] = '';
			}
			else if (uuid in games && games[uuid] == '') {
				console.log('already searching for game');
			}
			else {
				// (games.hasOwnProperty(uuid) && games[uuid] != "") {
				console.log('user alredy in game');
				return;
			}
			// TODO: step2 : sesrch in record<> find guid w/ "" &/ pair them up
			// TODO: step3 : move game logic to lifecycle of queu'ed game
		});

		// other:
		socket.on('message', (message: string) => {
			const obj: ClientMessage = JSON.parse(message) as ClientMessage;
			clientChat.set(socket.id, { user: obj.user, lastSeen: Date.now() });
			socket.emit('welcome', { msg: 'Welcome to the chat! : ' });
			broadcast(fastify, obj, obj.SenderWindowID);
		});
		socket.on('inviteGame', async (data: string) => {
			const clientName: string = clientChat.get(socket.id)?.user || '';
			const profilInvite: ClientProfil = JSON.parse(data) || '';
			const inviteHtml: string =
				'invites you to a game ' + setGameLink('');
			if (clientName !== null) {
				sendInvite(fastify, inviteHtml, profilInvite);
			}
		});
	});
}
