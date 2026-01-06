import { addMessage } from "./addMessage";
import { Socket } from 'socket.io-client';
import { getUser } from "@app/auth";
import type { ClientMessage } from "../types_front";
import { noGuestFlag } from "../chat";
/**
 * function sends socket.emit to the backend to active and broadcast a message to all sockets
 * echos the message with addMessage to the sender
 * @param socket 
 * @param msgCommand 
 */
export function broadcastMsg (socket: Socket, msgCommand: string[]): void {
	let msgText = msgCommand[1] ?? "";
	let dest = '';					
	addMessage(msgText);
	const user = getUser();
	if (user && socket?.connected) {
		const message:  ClientMessage = {
			command: msgCommand[0],
			destination: '',
			type: "chat",
			user: user.name,
			token: document.cookie,
			text: msgText,
			timestamp: Date.now(),
			SenderWindowID: socket.id ?? "",
			SenderUserName: user.name,
			SenderUserID: user.id,
			userID: '', 
			frontendUserName: '', 
			frontendUser: '', 
			Sendertext: '',
			};
		socket.emit('message', JSON.stringify(message));
	}
};
