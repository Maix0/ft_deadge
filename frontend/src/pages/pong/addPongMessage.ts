import { color } from './pong';

/**
 * function adds a message to the frontend pongMessage
 * ATTENTION send inner HTML ******
 * @param text 
 * @returns 
 */

export function addPongMessage(text: string) {
	const pongMessage = document.getElementById("system-box") as HTMLDivElement;
	if (!pongMessage) return;
	const messageElement = document.createElement("div-test");
	messageElement.innerHTML = text;
	pongMessage.appendChild(messageElement);
	pongMessage.scrollTop = pongMessage.scrollHeight;
	console.log(`%c DEBUG LOG: Added PONG new message:%c ${text}`, color.red, color.reset);
	return ;
};