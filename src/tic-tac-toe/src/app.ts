// import fastify, { FastifyInstance, FastifyPluginAsync } from 'fastify';
// // TODO: Import Fastify formbody
// // TODO: Import Fastify multipart
// // TODO: Import shared database
// // TODO: Import shared auth
// // TODO: Import shared swagger
// // TODO: Import shared utils
// // TODO: Import socketio

// // @brief ???
// declare const __SERVICE_NAME: string;

// // TODO: Import the plugins defined for this microservice
// // TODO: Import the routes defined for this microservice

// // @brief The microservice app (as a plugin for Fastify), kinda like a main function I guess ???
// // @param fastify
// // @param opts
// export const app: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
// 	// Register all the fastify plugins that this app will use

// 	// Once it is done:
// 	fastify.ready((err) => {
// 		if (err) {
// 			throw err;
// 		}
// 		// TODO: Supposedly, something should be there I guess
// 	});
// };
// // Export it as the default for this file.
// export default app;

// // TODO: Understand what is this for in /src/chat/src/app.ts
// // declare module 'fastify' {
// // 	interface FastifyInstance {
// // 		io: Server<{
// // 			hello: (message: string) => string;
// // 			MsgObjectServer: (data: { message: ClientMessage }) => void;
// // 			message: (msg: string) => void;
// // 			testend: (sock_id_client: string) => void;
// // 		}>;
// // 	}
// // }

// // TODO: Same for this, also in /src/chat/src/app.ts
// // async function onReady(fastify: FastifyInstance) {
// // 	function connectedUser(io?: Server, target?: string): number {
// // 		let count = 0;
// // 		const seen = new Set<string>();
// // 		// <- only log/count unique usernames

// // 		for (const [socketId, username] of clientChat) {
// // 			// Basic sanity checks
// // 			if (typeof socketId !== 'string' || socketId.length === 0) {
// // 				clientChat.delete(socketId);
// // 				continue;
// // 			}
// // 			if (typeof username !== 'string' || username.length === 0) {
// // 				clientChat.delete(socketId);
// // 				continue;
// // 			}

// // 			// If we have the io instance, attempt to validate the socket is still connected
// // 			if (io && typeof io.sockets?.sockets?.get === 'function') {
// // 				const s = io.sockets.sockets.get(socketId) as
// // 					| Socket
// // 					| undefined;
// // 				// If socket not found or disconnected, remove from map and skip
// // 				if (!s || s.disconnected) {
// // 					clientChat.delete(socketId);
// // 					continue;
// // 				}

// // 				// Skip duplicates (DO NOT delete them — just don't count)
// // 				if (seen.has(username)) {
// // 					continue;
// // 				}
// // 				// socket exists and is connected
// // 				seen.add(username);
// // 				count++;
// // 				// console.log(color.green,"count: ", count);
// // 				console.log(color.yellow, 'Client:', color.reset, username);

// // 				const targetSocketId = target;
// // 				io.to(targetSocketId!).emit('listObj', username);

// // 				console.log(
// // 					color.yellow,
// // 					'Chat Socket ID:',
// // 					color.reset,
// // 					socketId,
// // 				);
// // 				continue;
// // 			}

// // 			// If no io provided, assume entries in the map are valid and count them.
// // 			count++;
// // 			console.log(
// // 				color.red,
// // 				'Client (unverified):',
// // 				color.reset,
// // 				username,
// // 			);
// // 			console.log(
// // 				color.red,
// // 				'Chat Socket ID (unverified):',
// // 				color.reset,
// // 				socketId,
// // 			);
// // 		}

// // 		return count;
// // 	}

// // 	function broadcast(data: ClientMessage, sender?: string) {
// // 		fastify.io.fetchSockets().then((sockets) => {
// // 			for (const s of sockets) {
// // 				if (s.id !== sender) {
// // 					// Send REAL JSON object
// // 					const clientName = clientChat.get(s.id) || null;
// // 					if (clientName !== null) {
// // 						s.emit('MsgObjectServer', { message: data });
// // 					}
// // 					console.log(' Target window socket ID:', s.id);
// // 					console.log(' Target window ID:', [...s.rooms]);
// // 					console.log(' Sender window ID:', sender ? sender : 'none');
// // 				}
// // 			}
// // 		});
// // 	}

// // 	fastify.io.on('connection', (socket: Socket) => {
// // 		socket.on('message', (message: string) => {
// // 			console.info(
// // 				color.blue,
// // 				'Socket connected!',
// // 				color.reset,
// // 				socket.id,
// // 			);
// // 			console.log(
// // 				color.blue,
// // 				'Received message from client',
// // 				color.reset,
// // 				message,
// // 			);

// // 			const obj: ClientMessage = JSON.parse(message) as ClientMessage;
// // 			clientChat.set(socket.id, obj.user);
// // 			console.log(
// // 				color.green,
// // 				'Message from client',
// // 				color.reset,
// // 				`Sender: login name: "${obj.user}" - windowID "${obj.SenderWindowID}" - text message: "${obj.text}"`,
// // 			);
// // 			// Send object directly — DO NOT wrap it in a string
// // 			broadcast(obj, obj.SenderWindowID);
// // 			console.log(
// // 				color.red,
// // 				'connected in the Chat :',
// // 				connectedUser(fastify.io),
// // 				color.reset,
// // 			);
// // 		});

// // 		socket.on('testend', (sock_id_cl: string) => {
// // 			console.log('testend received from client socket id:', sock_id_cl);
// // 		});

// // 		socket.on('list', () => {
// // 			console.log(color.red, 'list activated', color.reset, socket.id);
// // 			connectedUser(fastify.io, socket.id);
// // 		});

// // 		socket.on('disconnecting', (reason) => {
// // 			const clientName = clientChat.get(socket.id) || null;
// // 			console.log(
// // 				color.green,
// // 				`Client disconnecting: ${clientName} (${socket.id}) reason:`,
// // 				reason,
// // 			);
// // 			if (reason === 'transport error') return;

// // 			if (clientName !== null) {
// // 				const obj = {
// // 					type: 'chat',
// // 					user: clientName,
// // 					token: '',
// // 					text: 'LEFT the chat',
// // 					timestamp: Date.now(),
// // 					SenderWindowID: socket.id,
// // 				};

// // 				broadcast(obj, obj.SenderWindowID);
// // 				//   clientChat.delete(obj.user);
// // 			}
// // 		});
// // 	});
// // }