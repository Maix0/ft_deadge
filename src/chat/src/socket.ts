import { Server, Socket } from 'socket.io';

export const color = {
	red: 'x1b[31m',
	green: 'x1b[32m',
	yellow: 'x1b[33m',
	blue: 'x1b[34m',
	reset: 'x1b[0m',
};

type ClientMessage = {
	userID: string;
	text: string;
	SenderWindowID: string;
};

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
	interface FastifyInstance {
		io: Server<{
			hello: (message: string) => string,
            MsgObjectServer: (data: { message: ClientMessage }) => void,
			message: (msg: string) => void,
			testend: (sock_id_client: string) => void,
		}>
	}
};

export function setupSocketIo(fastify: import('fastify').FastifyInstance): void {

	fastify.ready((err) => {
		if (err) throw err;

		// Broadcast function to send messages to all connected clients except the sender
		function broadcast(data: ClientMessage, sender?: string) {
			fastify.io.fetchSockets().then((sockets) => {
				console.log('Connected clients:', sockets.length);

				for (const s of sockets) {
					if (s.id !== sender) {
						// Send REAL JSON object
						s.emit('MsgObjectServer', { message: data });

						console.log(' emit window socket ID:', s.id);
						console.log(' emit window ID:', [...s.rooms]);
						console.log(' Sender window ID:', sender ? sender : 'none');
						console.log(' text recieved:', data.text ? data.text : 'none');
						console.log(color.red, 'data:', color.reset, data ? data : 'none');
					}
				}
			});
		};
		// console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(fastify.io)));
		fastify.io.on('connection', (socket : Socket) => {
			console.info(color.blue, 'Socket connected!', color.reset, socket.id);
			socket.on('message', (message: string) => {
				console.log(color.blue, 'Received message from client', color.reset, message);
				const obj: ClientMessage = JSON.parse(message) as ClientMessage;
				console.log(color.green, 'Message from client', color.reset, `${obj.userID}: ${obj.text}`);

				// Send object directly — DO NOT wrap it in a string
				broadcast(obj, obj.SenderWindowID);
			});
			socket.on('testend', (sock_id_cl : string) => {
				console.log('testend received from client socket id:', sock_id_cl);
			});
			socket.on('disconnecting', (reason) => {
				console.log('Client is disconnecting:', socket.id, 'reason:', reason);
				console.log('Socket AAAAAAAActing because:', socket.connected);
			});
		});
	});
};