import io, { Socket } from 'socket.io-client';

/**
 * function clears all messages in the chat window
 * @param senderSocket 
 * @returns 
 */
export function clearChatWindow(senderSocket: Socket) {
	const chatWindow = document.getElementById("t-chatbox") as HTMLDivElement;
	if (!chatWindow) return;
	chatWindow.innerHTML = "";
	// senderSocket.emit('nextGame');
}