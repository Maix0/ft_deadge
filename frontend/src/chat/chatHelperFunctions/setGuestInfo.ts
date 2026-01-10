import { Socket } from 'socket.io-client';

/**
 * getProfil of a user
 * @param socket 
 * @param user 
 * @returns 
 */

export function setGuestInfo(socket: Socket, user: string, guest: boolean) {
		if (!socket.connected) return;
		const profilInfo = {
			command: '@guestInfo',
			destination: 'guestInfo',
			type: "chat",
			user: user,
			token: document.cookie ?? "",
			text: user,
			timestamp: Date.now(),
			SenderWindowID: socket.id,
			guest: guest,
		};
		socket.emit('guestInfo', JSON.stringify(profilInfo));
}
