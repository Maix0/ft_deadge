import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fastifyFormBody from '@fastify/formbody';
import fastifyMultipart from '@fastify/multipart';
import * as db from '@shared/database';
import * as auth from '@shared/auth';
import * as swagger from '@shared/swagger';
import * as utils from '@shared/utils';
import { Server, Socket } from 'socket.io';

// colors for console.log
export const color = {
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	reset: '\x1b[0m',
};

// shows address for connection au server transcendance
const session = process.env.SESSION_MANAGER ?? '';
const part = session.split('/')[1];
const machineName = part.split('.')[0];
console.log(color.yellow, 'Connect at : https://' + machineName + ':8888/app/login');


declare const __SERVICE_NAME: string;

// Global map of clients
// key = socket, value = clientname
interface ClientInfo {
  user: string;
  lastSeen: number;
}

const clientChat = new Map<string, ClientInfo>();

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


type ClientMessage = {
	user: string;
	text: string;
	SenderWindowID: string;
};

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
	interface FastifyInstance {
		io: Server<{
			hello: (message: string) => string;
			MsgObjectServer: (data: { message: ClientMessage }) => void;
			message: (msg: string) => void;
			listBud: (msg: string) => void;
			testend: (sock_id_client: string) => void;
			client_entered: (userName: string, user: string) => void;
			client_left: (userName: string, why: string) => void;
			list: (oldUser: string, user: string) => void;
			updateClientName: (oldUser: string, user: string) => void;
		}>;
	}
}

async function onReady(fastify: FastifyInstance) {
	function connectedUser(io?: Server, target?: string): number {
		let count = 0;
		const seen = new Set<string>();
		// <- only log/count unique usernames

		for (const [socketId, username] of clientChat) {
			// Basic sanity checks
			if (typeof socketId !== 'string' || socketId.length === 0) {
				clientChat.delete(socketId);
				continue;
			}
			if (typeof username.user !== 'string' || username.user.length === 0) {
				clientChat.delete(socketId);
				continue;
			}

			// If we have the io instance, attempt to validate the socket is still connected
			if (io && typeof io.sockets?.sockets?.get === 'function') {
				const s = io.sockets.sockets.get(socketId) as
					| Socket
					| undefined;
				// If socket not found or disconnected, remove from map and skip
				if (!s || s.disconnected) {
					clientChat.delete(socketId);
					continue;
				}

				// Skip duplicates (DO NOT delete them — just don't count)
				if (seen.has(username.user)) {
					continue;
				}
				// socket exists and is connected
				seen.add(username.user);
				count++;
				// console.log(color.green,"count: ", count);
				console.log(color.yellow, 'Client:', color.reset, username.user);

				const targetSocketId = target;
				// io.to(targetSocketId!).emit('listObj', username.user);
				io.to(targetSocketId!).emit('listBud', username.user);
				console.log(
					color.yellow,
					'Chat Socket ID:',
					color.reset,
					socketId,
				);
				continue;
			}

			// If no io provided, assume entries in the map are valid and count them.
			count++;
			console.log(
				color.red,
				'Client (unverified):',
				color.reset,
				username,
			);
			console.log(
				color.red,
				'Chat Socket ID (unverified):',
				color.reset,
				socketId,
			);
		}
		return count;
	}

	function broadcast(data: ClientMessage, sender?: string) {
		fastify.io.fetchSockets().then((sockets) => {
			for (const s of sockets) {
				if (s.id !== sender) {
					const clientName = clientChat.get(s.id)?.user;
					// Send REAL JSON object
					if (clientName !== undefined) {
						s.emit('MsgObjectServer', { message: data });
						console.log(color.green, 'Name Sender', clientChat);
					}
					console.log(' Target window socket ID:', s.id);
					console.log(' Target window ID:', [...s.rooms]);
					console.log(' Sender window ID:', sender ? sender : 'none');
				}
			}
		});
	}

	fastify.io.on('connection', (socket: Socket) => {

		socket.on('message', (message: string) => {
			console.info(
				color.blue,
				'Socket connected!',
				color.reset,
				socket.id,
			);
			console.log(
				color.blue,
				'Received message from client',
				color.reset,
				message,
			);

			const obj: ClientMessage = JSON.parse(message) as ClientMessage;
			clientChat.set(socket.id, { user: obj.user, lastSeen: Date.now() });
			console.log(
				color.green,
				'Message from client',
				color.reset,
				`Sender: login name: ${obj.user} - windowID ${obj.SenderWindowID} - text message: ${obj.text}`,
			);
			socket.emit('welcome', {
				msg: 'Welcome to the chat! : ',
			});

			// Send object directly — DO NOT wrap it in a string
			broadcast(obj, obj.SenderWindowID);
			console.log(
				color.red,
				'connected in the Chat :',
				connectedUser(fastify.io),
				color.reset,
			);
		});

		socket.on('testend', (sock_id_cl: string) => {
			console.log('testend received from client socket id:', sock_id_cl);
		});

		socket.on('list', (object) => {

			const userFromFrontend = object || null;
			const client = clientChat.get(socket.id) || null;

			console.log(color.red, 'list activated', userFromFrontend, color.reset, socket.id);

			if (userFromFrontend.oldUser !== userFromFrontend.user) {
				console.log(color.red, 'list activated', userFromFrontend.oldUser, color.reset);
				if (client?.user === null) {
					console.log('ERROR: clientName is NULL');
					return;
				};
				if (client) {
  					client.user = userFromFrontend.user;
				}
			}
			connectedUser(fastify.io, socket.id);
		});

		socket.on('updateClientName', (object) => {
			const userFromFrontend = object || null;
			const client = clientChat.get(socket.id) || null;
			console.log(color.red, 'whoAMi activated', userFromFrontend, color.reset, socket.id);
			if (userFromFrontend.oldUser !== userFromFrontend.user) {
				console.log(color.red, 'whoAMi activated', userFromFrontend.oldUser, color.reset);
				if (client === null) {
					console.log('ERROR: clientName is NULL');
					return;
				};
				if (client) {
  					client.user = userFromFrontend.user;
				}
			}
		});


		socket.on('disconnecting', (reason) => {
			const clientName = clientChat.get(socket.id)?.user || null;
			console.log(
				color.green,
				`Client disconnecting: ${clientName} (${socket.id}) reason:`,
				reason,
			);
			if (reason === 'transport error') return;

			if (clientName !== null) {
				const obj = {
					type: 'chat',
					user: clientName,
					token: '',
					text: 'LEFT the chat',
					timestamp: Date.now(),
					SenderWindowID: socket.id,
				};

				broadcast(obj, obj.SenderWindowID);
			}
		});

		socket.on('client_left', (data) => {
			const clientName = clientChat.get(socket.id)?.user || null;
			const leftChat = data || null;
			console.log(
				color.green,
				`Left the Chat User: ${clientName} id Socket: ${socket.id} reason:`,
				leftChat.why,
			);

			if (clientName !== null) {
				const obj = {
					type: 'chat',
					user: clientName,
					token: '',
					text: 'LEFT the chat but the window is still open',
					timestamp: Date.now(),
					SenderWindowID: socket.id,
				};
				console.log(obj.SenderWindowID);
				broadcast(obj, obj.SenderWindowID);
				//   clientChat.delete(obj.user);
			}
		});

		socket.on('client_entered', (data) => {

    		// data may be undefined (when frontend calls emit with no payload)
    		const userNameFromFrontend = data?.userName || null;
    		const userFromFrontend = data?.user || null;
			let clientName = clientChat.get(socket.id)?.user || null;
			// const client = clientChat.get(socket.id) || null;
			let text = 'is back in the chat';

			if (clientName === null) {
				console.log('ERROR: clientName is NULL'); return;
			};
			// if (client === null) {
			// 	console.log('ERROR: client is NULL'); return;
			// };
			if (userNameFromFrontend !== userFromFrontend) {
				text = `'is back in the chat, I used to be called '${userNameFromFrontend}`;
				clientName = userFromFrontend;
				if (clientName === null) {
					console.log('ERROR: clientName is NULL'); return;
				};
				// if (client) {
  				// 	client.user = clientName;
				// }
			}
    		console.log(
    		    color.green,
    		    `Client entered the Chat: ${clientName} (${socket.id})`,
    		);
    		if (clientName !== null) {
    		    const obj = {
    		        type: 'chat',
    		        user: clientName,
    		        frontendUserName: userNameFromFrontend,
    		        frontendUser: userFromFrontend,
    		        token: '',
    		        text: text,
    		        timestamp: Date.now(),
    		        SenderWindowID: socket.id,
    		    };
    		    broadcast(obj, obj.SenderWindowID);
    		}
		});

	});
}
