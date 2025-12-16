import type { FastifyInstance } from 'fastify';
import { Socket } from 'socket.io';
import { clientChat } from './app';
import { connectedUser } from './connectedUser';
// import { color } from './app';

export function list_SocketListener(fastify: FastifyInstance, socket: Socket) {

	socket.on('list', (object) => {

		const userFromFrontend = object || null;
		const client = clientChat.get(socket.id) || null;
		// console.log(color.red, 'DEBUG LOG: list activated', userFromFrontend, color.reset, socket.id)
		if (userFromFrontend.oldUser !== userFromFrontend.user) {
			// console.log(color.red, 'DEBUG LOG: list activated', userFromFrontend.oldUser, color.reset);
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

}