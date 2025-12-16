import { clientChat } from './app';
import { Server, Socket } from 'socket.io';

/**
 * function check users connected to the chat with a socket and makes a seen list
 * calls listBud socket listener to update Ping Buddies List and calls listBuddies()
 * @param io
 * @param target
 * @returns the number connected
 */

export function connectedUser(io?: Server, target?: string): number {
	let count = 0;
	const seen = new Set<string>();
	// <- only log/count unique usernames
	for (const [socketId, username] of clientChat) {
		// Basic checks
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
			const socket = io.sockets.sockets.get(socketId) as Socket | undefined;
			// If socket not found or disconnected, remove from map and skip
			if (!socket || socket.disconnected) {
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
			const targetSocketId = target;
			io.to(targetSocketId!).emit('listBud', username.user);
			continue;
		}
		count++;
	}
	return count;
}