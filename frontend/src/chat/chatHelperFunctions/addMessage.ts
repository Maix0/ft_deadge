/**
 * function adds a message to the frontend chatWindow
 * @param text 
 * @returns 
 */

export function addMessage(text: string) {
	const chatWindow = document.getElementById("t-chatbox") as HTMLDivElement;
	if (!chatWindow) return;
	const messageElement = document.createElement("div-test");
	messageElement.textContent = text;
	chatWindow.appendChild(messageElement);
	chatWindow.scrollTop = chatWindow.scrollHeight;
	return ;
};