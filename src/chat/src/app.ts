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
import { broadcast } from './chatBackHelperFunctions/broadcast';
import type { ClientProfil, ClientMessage } from './chat_types';
import { sendPrivMessage } from './chatBackHelperFunctions/sendPrivMessage';
import { sendBlocked } from './chatBackHelperFunctions/sendBlocked';
import { sendInvite } from './chatBackHelperFunctions/sendInvite';
import { getUserByName } from './chatBackHelperFunctions/getUserByName';
import { makeProfil } from './chatBackHelperFunctions/makeProfil';
import { isBlocked } from './chatBackHelperFunctions/isBlocked';
import { sendProfil } from './chatBackHelperFunctions/sendProfil';
import { setGameLink } from './setGameLink';
import { nextGame_SocketListener } from './nextGame_SocketListener';
import { list_SocketListener } from './chatBackHelperFunctions/list_SocketListener';
import { isUser_BlockedBy_me } from './chatBackHelperFunctions/isUser_BlockedBy_me';
import type { ClientInfo, blockedUnBlocked } from './chat_types';


declare const __SERVICE_NAME: string;
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
			MsgObjectServer: (data: { message: ClientMessage }) => void;
			privMessage: (data: string) => void;
			guestmsg: (data: string) => void;
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
			blockBtn: (data: blockedUnBlocked) => void;
			isBlockdBtn: (data: blockedUnBlocked) => void;
			check_Block_button: (data: blockedUnBlocked) => void;
		}>;
	}
}

async function onReady(fastify: FastifyInstance) {
	const session = process.env.SESSION_MANAGER ?? '';
	if (session) {
		const part = session.split('/')[1];
		const machineName = part.split('.')[0];
		fastify.log.info(`Connect at : https://${machineName}:8888/`);
	}

	fastify.io.on('connection', (socket: Socket) => {
		socket.on('message', (message: string) => {
			const obj: ClientMessage = JSON.parse(message) as ClientMessage;
			if (!obj.user || !socket.id) return;
			clientChat.set(socket.id, { user: obj.user, socket: socket.id, lastSeen: Date.now() });
			socket.emit('welcome', { msg: 'Welcome to the chat! : ' });
			broadcast(fastify, obj, obj.SenderWindowID);
			fastify.log.info(`Client connected: ${socket.id}`);
		});
		nextGame_SocketListener(fastify, socket);
		list_SocketListener(fastify, socket);

		socket.on('updateClientName', (object) => {
			const userFromFrontend = object || null;
			const client = clientChat.get(socket.id) || null;
			if (userFromFrontend.oldUser !== userFromFrontend.user) {
				if (client) {
  					client.user = userFromFrontend.user;
				}
			}
		});

		socket.on('logout', () => {
		  const clientInfo = clientChat.get(socket.id);
		  const clientName = clientInfo?.user;

		  if (!clientName) return;
		  	const obj: ClientMessage = {
				command: '',
				destination: 'system-info',
		    	type: 'chat' as const,
		    	user: clientName,
		    	text: 'LEFT the chat',
				timestamp: Date.now(),
				SenderWindowID: socket.id,
			};
			broadcast(fastify, obj, socket.id);
			clientChat.delete(socket.id);
			if (socket.connected) socket.disconnect(true);
		});

		socket.on('disconnecting', (reason) => {
			const clientName = clientChat.get(socket.id)?.user || null;
			if (reason === 'transport error') return;

			if (clientName !== null) {
				const obj: ClientMessage = {
					command: '',
					destination: 'system-info',
					type: 'chat',
					user: clientName,
					text: 'LEFT the chat',
					timestamp: Date.now(),
					SenderWindowID: socket.id,
				};
				broadcast(fastify, obj, obj.SenderWindowID);
			}
		});

		socket.on('client_left', (data) => {
			void data;
			const clientName = clientChat.get(socket.id)?.user || null;
			if (clientName !== null) {
				const obj: ClientMessage = {
					command: '',
					destination: 'system-info',
					type: 'chat',
					user: clientName,
					text: 'LEFT the chat but the window is still open',
					timestamp: Date.now(),
					SenderWindowID: socket.id,
				};
				broadcast(fastify, obj, obj.SenderWindowID);
			}
		});


		socket.on('privMessage', (data) => {
			const clientName: string = clientChat.get(socket.id)?.user || '';
			const prvMessage: ClientMessage = JSON.parse(data) || '';
			if (clientName !== null) {
				const obj: ClientMessage = {
					command: prvMessage.command,
					destination: 'privateMsg',
					type: 'chat',
					user: clientName,
					text: prvMessage.text,
					timestamp: Date.now(),
					SenderWindowID: socket.id,
				};
				sendPrivMessage(fastify, obj, obj.SenderWindowID);
			}
		});

		socket.on('guestmsg', (data) => {
			const clientName: string = clientChat.get(socket.id)?.user || '';
			const profile: ClientProfil = JSON.parse(data) || '';
			const users: User[] = fastify.db.getAllUsers() ?? [];
			const user: User | null = getUserByName(users, clientName);
			if (!user) return;
			if (clientName !== null) {
				if (profile.guestmsg) {
					fastify.db.allowGuestMessage(user?.id);
				}
				else {
					fastify.db.denyGuestMessage(user?.id);
				};
			}
		});

		socket.on('profilMessage', async (data: string) => {
			const clientName: string = clientChat.get(socket.id)?.user || '';
			const profilMessage: ClientMessage = JSON.parse(data) || '';
			if (!profilMessage.user) return;
			const profile: ClientProfil = await makeProfil(fastify, profilMessage.user, socket);
			if (clientName !== null) {
				sendProfil(fastify, profile, profile.SenderWindowID);
			}
		});

		socket.on('inviteGame', async (data: string) => {
			const clientName: string = clientChat.get(socket.id)?.user || '';
			const profilInvite: ClientProfil = JSON.parse(data) || '';

			const inviteHtml: string = 'invites you to a game ' + setGameLink('');
			if (clientName !== null) {
				sendInvite(fastify, inviteHtml, profilInvite);
			}
		});

		socket.on('isBlockdBtn', async (data: ClientProfil) => {
			const profilBlock: ClientProfil = data || '';
			const users: User[] = fastify.db.getAllUsers() ?? [];
			const UserToBlock: User | null = getUserByName(users, `${profilBlock.user}`);
			const UserAskingToBlock: User | null = getUserByName(users, `${profilBlock.SenderName}`);
			if (!UserAskingToBlock || !UserToBlock) return;
			if (isUser_BlockedBy_me(fastify, UserAskingToBlock!.id, UserToBlock!.id)) {
				const message: blockedUnBlocked = {
					userState: 'block',
					userTarget: UserToBlock.name,
					by: UserAskingToBlock.name,
				};
				socket.emit('blockBtn', message);
			}
			else {

				const message: blockedUnBlocked = {
					userState: 'un-block',
					userTarget: UserToBlock.name,
					by: UserAskingToBlock.name,
				};
				socket.emit('blockBtn', message);
			}
		});

		socket.on('blockUser', async (data: string) => {
			const clientName: string = clientChat.get(socket.id)?.user || '';
			const profilBlock: ClientProfil = JSON.parse(data) || '';
			const users: User[] = fastify.db.getAllUsers() ?? [];
			const UserToBlock: User | null = getUserByName(users, `${profilBlock.user}`);
			const UserAskingToBlock: User | null = getUserByName(users, `${profilBlock.SenderName}`);
			const usersBlocked: BlockedData[] = fastify.db.getAllBlockedUsers() ?? [];
			if (!UserAskingToBlock || !UserToBlock || !usersBlocked) return;
			const userAreBlocked: boolean = isBlocked(UserAskingToBlock, UserToBlock, usersBlocked);
			if (isUser_BlockedBy_me(fastify, UserAskingToBlock!.id, UserToBlock!.id)) {
				const message: blockedUnBlocked = {
					userState: 'un-block',
					userTarget: UserToBlock.name,
					by: UserAskingToBlock.name,
				};
				socket.emit('blockBtn', message);
			}
			else {
				const message: blockedUnBlocked = {
					userState: 'block',
					userTarget: UserToBlock.name,
					by: UserAskingToBlock.name,
				};
				socket.emit('blockBtn', message);
			}

			if (userAreBlocked) {
				fastify.db.removeBlockedUserFor(UserAskingToBlock!.id, UserToBlock!.id);
				if (clientName !== null) {
					const blockedMessage = 'I have un-blocked you';
					if (clientName !== null) {
						const obj: ClientProfil = {
							command: 'message',
							destination: 'privateMsg',
							type: 'chat',
							user: clientName,
							timestamp: Date.now(),
							SenderWindowID: socket.id,
							Sendertext: 'You have un-blocked',
						};
						socket.emit('privMessageCopy', `${obj.Sendertext}: ${UserToBlock.name}💚`);
					}
					sendBlocked(fastify, blockedMessage, profilBlock);
				}
			}
			else {
				fastify.db.addBlockedUserFor(UserAskingToBlock!.id, UserToBlock!.id);
				if (clientName !== null) {
					const blockedMessage: string = 'I have blocked you';
					profilBlock.Sendertext = 'You have blocked ';
					if (clientName !== null) {
						const obj: ClientMessage = {
							command: 'message',
							destination: 'privateMsg',
							type: 'chat',
							user: clientName,
							timestamp: Date.now(),
							SenderWindowID: socket.id,
							Sendertext: 'You have blocked',
						};
						socket.emit('privMessageCopy', `${obj.Sendertext}: ${UserToBlock.name}⛔`);
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
			let text = 'is back in the chat';

			if (clientName === null) {
				fastify.log.error('ERROR1: clientName is NULL'); return;
			};
			if (userNameFromFrontend !== userFromFrontend) {
				text = `'is back in the chat, I used to be called '${userNameFromFrontend}`;
				clientName = userFromFrontend;
				if (clientName === null) {
					fastify.log.error('ERROR2: clientName is NULL'); return;
				};
			}
    		if (clientName !== null) {
    		    const obj: ClientMessage = {
					command: '',
					destination: 'system-info',
    		        type: 'chat',
    		        user: clientName,
    		        frontendUserName: userNameFromFrontend,
    		        frontendUser: userFromFrontend,
    		        text: text,
    		        timestamp: Date.now(),
    		        SenderWindowID: socket.id,
    		    };
    		    broadcast(fastify, obj, obj.SenderWindowID);
    		}
		});

	});
}
