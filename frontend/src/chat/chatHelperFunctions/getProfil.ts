import { Socket } from 'socket.io-client';
import type { ClientProfil } from '../types_front';

/**
 * getProfil of a user
 * @param socket 
 * @param user 
 * @returns 
 */

export function getProfil(socket: Socket, user: string) {
		if (!socket.connected) return;
		const profil: ClientProfil = {
			command: '@profile',
			destination: 'profilMessage',
			type: "chat",
			user: user,
			token: document.cookie ?? "",
			text: user,
			userID: '',
			timestamp: Date.now(),
			SenderWindowID: socket.id,
		};
		socket.emit('profilMessage', JSON.stringify(profil));
}
