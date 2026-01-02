import type { FastifyInstance } from 'fastify';
import { Socket } from 'socket.io';
import { clientChat } from '../app';
import { connectedUser } from './connectedUser';

export function list_SocketListener(fastify: FastifyInstance, socket: Socket) {

	socket.on('list', (object) => {

		const userFromFrontend = object || null;
		const client = clientChat.get(socket.id) || null;
		if (userFromFrontend.oldUser !== userFromFrontend.user) {
			if (client?.user === null) {
				return;
			};
			if (client) {
				client.user = userFromFrontend.user;
			}
		}
		connectedUser(fastify.io, socket.id);
	});
}