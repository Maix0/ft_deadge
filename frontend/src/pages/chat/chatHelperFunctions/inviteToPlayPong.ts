import { Socket } from 'socket.io-client';
import type { ClientProfil } from '../types_front';
import { getUser } from '@app/auth';
import { addMessage } from './addMessage';

/**
 * function displays an invite message to sender
 * it also sends a message to backend for a link and displays it in the target window
 * @param profil of the target
 * @param senderSocket 
 */

export function inviteToPlayPong(profil: ClientProfil, senderSocket: Socket) {
	profil.SenderName = getUser()?.name ?? '';
	if (profil.SenderName === profil.user) return;
	addMessage(`You invited to play: ${profil.user}🏓`)
	senderSocket.emit('inviteGame', JSON.stringify(profil));
};