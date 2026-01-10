import { Socket } from 'socket.io-client';
import type { ClientProfil } from '../types_front';
import { getUser } from "@app/auth";

export function blockUser(profil: ClientProfil, senderSocket: Socket) {
	profil.SenderName = getUser()?.name ?? '';
	if (profil.SenderName === profil.user) return;
	senderSocket.emit('blockUser', JSON.stringify(profil));
};