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
			pong_bat_left: (direction: "up" | "down") => void;

		}>;
	}
}

async function onReady(fastify: FastifyInstance) {

	// shows address for connection au server transcendance
	const session = process.env.SESSION_MANAGER ?? '';
	if (session) {
		const part = session.split('/')[1];
		const machineName = part.split('.')[0];
		console.log(color.yellow, 'Connect at : https://' + machineName + ':8888/app/login');
	}

	let batY = 185; // shared bat position
	const SPEED = 10;

	fastify.io.on('connection', (socket: Socket) => {


  		socket.emit("bat:update", batY);

  		socket.on('bat:move', (direction: "up" | "down") => {
  		  if (direction === "up") {  
			batY -= SPEED; 
			console.log('w pressed UP');
		  }
  		  if (direction === "down") { 
			console.log('s pressed DOWN');

			batY += SPEED;
		  }
  		  // clamp inside field
  		  batY = Math.max(0, Math.min(370, batY));
		
  		  socket.emit("bat:update", batY);
  		});

		socket.on('message', (message: string) => {
			const obj: ClientMessage = JSON.parse(message) as ClientMessage;
			clientChat.set(socket.id, { user: obj.user, lastSeen: Date.now() });
			socket.emit('welcome', {msg: 'Welcome to the chat! : '});
			broadcast(fastify, obj, obj.SenderWindowID);
		});

		socket.on('inviteGame', async (data: string) => {
			const clientName: string = clientChat.get(socket.id)?.user || '';
			const profilInvite: ClientProfil = JSON.parse(data) || '';
			const inviteHtml: string = 'invites you to a game ' + setGameLink('');
			if (clientName !== null) {
				sendInvite(fastify, inviteHtml, profilInvite);
			}
		});
	});
}
