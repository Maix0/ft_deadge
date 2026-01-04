import { Socket } from 'socket.io-client';

/**
 * getProfil of a user
 * @param socket 
 * @param user 
 * @returns 
 */

export function getProfil(socket: Socket, user: string) {
		if (!socket.connected) return;
		const profil = {
			command: '@profile',
			destination: 'profilMessage',
			type: "chat",
			user: user,
			token: document.cookie ?? "",
			text: user,
			timestamp: Date.now(),
			SenderWindowID: socket.id,
		};
		socket.emit('profilMessage', JSON.stringify(profil));
}
