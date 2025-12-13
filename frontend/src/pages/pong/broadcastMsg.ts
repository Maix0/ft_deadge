import { addPongMessage } from "./addPongMessage";
import { Socket } from 'socket.io-client';
import { getUser } from "@app/auth";

/**
 * function sends socket.emit to the backend to active and broadcast a message to all sockets
 * echos the message with addMessage to the sender
 * @param socket 
 * @param msgCommand 
 */
export function broadcastMsg (socket: Socket, msgCommand: string[]): void {
	let msgText = msgCommand[1] ?? "";					
	addPongMessage(msgText);
	const user = getUser();
	if (user && socket?.connected) {
		const message = {
			command: msgCommand,
			destination: '',
			type: "chat",
			user: user.name,
			token: document.cookie,
			text: msgText,
			timestamp: Date.now(),
			SenderWindowID: socket.id,
			};
		socket.emit('message', JSON.stringify(message));
	}
};
