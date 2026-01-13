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


export function addInviteMessage(text: string) {
	const htmlBaliseRegex = new RegExp(/<a\b[^>]*>[\s\S]*?<\/a>/g);
	const htmlBaliseMatch = text.match(htmlBaliseRegex);

	if (!htmlBaliseMatch) return;
	const chatWindow = document.getElementById("t-chatbox") as HTMLDivElement;
	if (!chatWindow) return;
	const messageElement = document.createElement("div-test");
	messageElement.innerHTML = `🏓${text.replaceAll(htmlBaliseRegex, "").replaceAll("🔒", '').replaceAll("invites you", "You have invited")}${htmlBaliseMatch[0]}🔒`
	chatWindow.appendChild(messageElement);
	chatWindow.scrollTop = chatWindow.scrollHeight;
	return ;
};
