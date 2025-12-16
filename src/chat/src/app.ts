import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fastifyFormBody from '@fastify/formbody';
import fastifyMultipart from '@fastify/multipart';
import * as db from '@shared/database';
import * as auth from '@shared/auth';
import * as swagger from '@shared/swagger';
import * as utils from '@shared/utils';
import { Server, Socket } from 'socket.io';
import type { User } from '@shared/database/mixin/user';
import type { BlockedData } from '@shared/database/mixin/blocked';
import { broadcast } from './broadcast';
import type { ClientProfil, ClientMessage } from './chat_types';
import { sendPrivMessage } from './sendPrivMessage';
import { sendBlocked } from './sendBlocked';
import { sendInvite } from './sendInvite';
import { getUserByName } from './getUserByName';
import { makeProfil } from './makeProfil';
import { isBlocked } from './isBlocked';
import { sendProfil } from './sendProfil';
import { setGameLink } from './setGameLink';
import { nextGame_SocketListener } from './nextGame_SocketListener';
import { list_SocketListener } from './list_SocketListener';

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

// function setAboutPlayer(about: string): string {
// 	if (!about) {
// 		about = 'Player is good Shape - This is a default description';
// 	}
// 	return about;
// };

// function setGameLink(link: string): string {
// 	if (!link) {
// 		link = '<a href=\'https://google.com\' style=\'color: blue; text-decoration: underline; cursor: pointer;\'>Click me</a>';
// 	}
// 	return link;
// };

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
			hello: (message: string) => string;
			MsgObjectServer: (data: { message: ClientMessage }) => void;
			privMessage: (data: string) => void;
			profilMessage: (data: ClientProfil) => void;
			inviteGame: (data: ClientProfil) => void;
			blockUser: (data: ClientProfil) => void;
			privMessageCopy: (msg: string) => void;
			nextGame: (nextGame: string) => void;
			message: (msg: string) => void;
			listBud: (msg: string) => void;
			client_entered: (userName: string, user: string) => void;
			client_left: (userName: string, why: string) => void;
			list: (oldUser: string, user: string) => void;
			updateClientName: (oldUser: string, user: string) => void;
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


	fastify.io.on('connection', (socket: Socket) => {

		socket.on('message', (message: string) => {
			// console.info(color.blue, 'DEBUG LOG: Socket connected!', color.reset, socket.id);
			// console.log( color.blue, 'DEBUG LOG: Received message from client', color.reset, message);
			const obj: ClientMessage = JSON.parse(message) as ClientMessage;
			clientChat.set(socket.id, { user: obj.user, lastSeen: Date.now() });
			// console.log(color.green, 'DEBUG LOG: Message from client', color.reset, `Sender: login name: ${obj.user} - windowID ${obj.SenderWindowID} - text message: ${obj.text}`);
			socket.emit('welcome', { msg: 'Welcome to the chat! : ' });
			// Send object directly — DO NOT wrap it in a string
			broadcast(fastify, obj, obj.SenderWindowID);
			// console.log(color.red, 'DEBUG LOG: connected in the Chat :', connectedUser(fastify.io), color.reset);
		});

		nextGame_SocketListener(fastify, socket);

		list_SocketListener(fastify, socket);

		// socket.on('list', (object) => {

		// 	const userFromFrontend = object || null;
		// 	const client = clientChat.get(socket.id) || null;

		// 	//console.log(color.red, 'DEBUG LOG: list activated', userFromFrontend, color.reset, socket.id);

		// 	if (userFromFrontend.oldUser !== userFromFrontend.user) {
		// 		//console.log(color.red, 'DEBUG LOG: list activated', userFromFrontend.oldUser, color.reset);
		// 		// if (client?.user === null) {
		// 		// 	console.log('ERROR: clientName is NULL');
		// 		// 	return;
		// 		// };
		// 		if (client) {
  		// 			client.user = userFromFrontend.user;
		// 		}
		// 	}
		// 	connectedUser(fastify.io, socket.id);
		// });

		socket.on('updateClientName', (object) => {
			const userFromFrontend = object || null;
			const client = clientChat.get(socket.id) || null;
			// console.log(color.red, 'DEBUG LOG: whoAMi activated', userFromFrontend, color.reset, socket.id);
			if (userFromFrontend.oldUser !== userFromFrontend.user) {
				// console.log(color.red, 'DEBUG LOG: whoAMi activated', userFromFrontend.oldUser, color.reset);
				// if (client === null) {
				// 	console.log('ERROR: clientName is NULL');
				// 	return;
				// };
				if (client) {
  					client.user = userFromFrontend.user;
					console.log(color.yellow, `'DEBUG LOG: client.user is, '${client.user}'`);
				}
			}
		});

		socket.on('logout', () => {
		  const clientInfo = clientChat.get(socket.id);
		  const clientName = clientInfo?.user;

		  if (!clientName) return;
		  	console.log(color.green, `Client logging out: ${clientName} (${socket.id})`);
		  	const obj = {
				command: '',
				destination: 'system-info',
		    	type: 'chat' as const,
		    	user: clientName,
		    	token: '',
		    	text: 'LEFT the chat',
		    	timestamp: Date.now(),
		    	SenderWindowID: socket.id,
			};
			broadcast(fastify, obj, socket.id);
			// Optional: remove from map
			clientChat.delete(socket.id);
			// Ensure socket is fully disconnected
			if (socket.connected) socket.disconnect(true);
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
					command: '',
					destination: 'system-info',
					type: 'chat',
					user: clientName,
					token: '',
					text: 'LEFT the chat',
					timestamp: Date.now(),
					SenderWindowID: socket.id,
				};

				broadcast(fastify, obj, obj.SenderWindowID);
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
					command: '',
					destination: 'system-info',
					type: 'chat',
					user: clientName,
					token: '',
					text: 'LEFT the chat but the window is still open',
					timestamp: Date.now(),
					SenderWindowID: socket.id,
				};
				// console.log(color.blue, 'DEBUG LOG: BROADCASTS OUT :', obj.SenderWindowID);

				broadcast(fastify, obj, obj.SenderWindowID);
				//   clientChat.delete(obj.user);
			}
		});


		socket.on('privMessage', (data) => {
			const clientName: string = clientChat.get(socket.id)?.user || '';
			const prvMessage: ClientMessage = JSON.parse(data) || '';
			console.log(
				color.blue,
				`DEBUG LOG: ClientName: '${clientName}' id Socket: '${socket.id}' target Name:`,
				prvMessage.command,
			);

			if (clientName !== null) {
				const obj = {
					command: prvMessage.command,
					destination: 'privateMsg',
					type: 'chat',
					user: clientName,
					token: '',
					text: prvMessage.text,
					timestamp: Date.now(),
					SenderWindowID: socket.id,
				};
				// console.log(color.blue, 'DEBUG LOG: PRIV MESSAGE OUT :', obj.SenderWindowID);
				sendPrivMessage(fastify, obj, obj.SenderWindowID);
				//   clientChat.delete(obj.user);
			}
		});

		socket.on('profilMessage', async (data: string) => {
			const clientName: string = clientChat.get(socket.id)?.user || '';
			const profilMessage: ClientMessage = JSON.parse(data) || '';
			const users: User[] = fastify.db.getAllUsers() ?? [];
			// console.log(color.yellow, 'DEBUG LOG: ALL USERS EVER CONNECTED:', users);
			// console.log(color.blue, `DEBUG LOG: ClientName: '${clientName}' id Socket: '${socket.id}' target profil:`, profilMessage.user);
			const profile: ClientProfil = await makeProfil(fastify, profilMessage.user, socket);
			if (clientName !== null) {
				const testuser: User | null = getUserByName(users, profilMessage.user);
				console.log(color.yellow, 'user:', testuser?.name ?? 'Guest');
				console.log(color.blue, 'DEBUG - profil message MESSAGE OUT :', profile.SenderWindowID);
				sendProfil(fastify, profile, profile.SenderWindowID);
				//   clientChat.delete(obj.user);
			}
		});

		socket.on('inviteGame', async (data: string) => {
			const clientName: string = clientChat.get(socket.id)?.user || '';
			const profilInvite: ClientProfil = JSON.parse(data) || '';
			// const users: User[] = fastify.db.getAllUsers() ?? [];

			const inviteHtml: string = 'invites you to a game ' + setGameLink('');
			if (clientName !== null) {
				// const testuser: User | null = getUserByName(users, profilInvite.user ?? '');
				// console.log(color.yellow, 'user:', testuser?.name ?? 'Guest');
				sendInvite(fastify, inviteHtml, profilInvite);
			}
		});

		socket.on('blockUser', async (data: string) => {
			const clientName: string = clientChat.get(socket.id)?.user || '';
			const profilBlock: ClientProfil = JSON.parse(data) || '';
			const users: User[] = fastify.db.getAllUsers() ?? [];
			const UserToBlock: User | null = getUserByName(users, `${profilBlock.user}`);
			const UserAskingToBlock: User | null = getUserByName(users, `${profilBlock.SenderName}`);

			console.log(color.yellow, `user to block: ${profilBlock.user}`);
			console.log(color.yellow, UserToBlock);
			console.log(color.yellow, `user Asking to block: ${profilBlock.SenderName}`);
			console.log(color.yellow, UserAskingToBlock);

			const usersBlocked: BlockedData[] = fastify.db.getAllBlockedUsers() ?? [];
			if (!UserAskingToBlock || !UserToBlock || !usersBlocked) return;
			const userAreBlocked: boolean = isBlocked(UserAskingToBlock, UserToBlock, usersBlocked);

			if (userAreBlocked) {
			    console.log(color.green, 'Both users are blocked as requested');
			    // return true;  // or any other action you need to take


				console.log(color.red, 'ALL BLOCKED USERS:', usersBlocked);
				fastify.db.removeBlockedUserFor(UserAskingToBlock!.id, UserToBlock!.id);
				const usersBlocked2 = fastify.db.getAllBlockedUsers();
				console.log(color.green, 'remove ALL BLOCKED USERS:', usersBlocked2);
				if (clientName !== null) {
					const blockedMessage = 'I have un-blocked you';
					if (clientName !== null) {
						const obj = {
							command: 'message',
							destination: 'privateMsg',
							type: 'chat',
							user: clientName,
							token: '',
							text: '',
							timestamp: Date.now(),
							SenderWindowID: socket.id,
							Sendertext: 'You have un-blocked',
						};
						// console.log(color.blue, 'DEBUG LOG: PRIV MESSAGE OUT :', obj.SenderWindowID);
						socket.emit('privMessageCopy', `${obj.Sendertext}: ${UserToBlock.name}💚`);
						//   clientChat.delete(obj.user);
					}
					// profilBlock.Sendertext = `'You have un-blocked '`;
					sendBlocked(fastify, blockedMessage, profilBlock);
				}
			}
			else {

			    console.log(color.red, 'The users are not blocked in this way');
				console.log(color.red, 'ALL BLOCKED USERS:', usersBlocked);
				fastify.db.addBlockedUserFor(UserAskingToBlock!.id, UserToBlock!.id);
				const usersBlocked2 = fastify.db.getAllBlockedUsers();
				console.log(color.green, 'ALL BLOCKED USERS:', usersBlocked2);
				if (clientName !== null) {
					const blockedMessage = 'I have blocked you';
					profilBlock.Sendertext = 'You have blocked ';
					if (clientName !== null) {
						const obj = {
							command: 'message',
							destination: 'privateMsg',
							type: 'chat',
							user: clientName,
							token: '',
							text: '',
							timestamp: Date.now(),
							SenderWindowID: socket.id,
							Sendertext: 'You have blocked',
						};
						// console.log(color.blue, 'DEBUG LOG: PRIV MESSAGE OUT :', obj.SenderWindowID);
						socket.emit('privMessageCopy', `${obj.Sendertext}: ${UserToBlock.name}⛔`);
						//   clientChat.delete(obj.user);
					}
					sendBlocked(fastify, blockedMessage, profilBlock);
				}
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
					command: '',
					destination: 'system-info',
    		        type: 'chat',
    		        user: clientName,
    		        frontendUserName: userNameFromFrontend,
    		        frontendUser: userFromFrontend,
    		        token: '',
    		        text: text,
    		        timestamp: Date.now(),
    		        SenderWindowID: socket.id,
    		    };
    		    broadcast(fastify, obj, obj.SenderWindowID);
    		}
		});

	});
}
