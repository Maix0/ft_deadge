import { incrementCounter } from "./incrementCounter";
// let count = 0;
// function incrementCounter(): number {
// 	count += 1;
// 	return count;
// }

export async function openMessagePopup(message: any) {

	const modalmessage = document.getElementById("modal-message") ?? null;
	if(!message) return
	const obj =  message;
	if (modalmessage) {
		const messageElement = document.createElement("div");
		messageElement.innerHTML = `
            			<div  id="profile-about">Game-Info: ${incrementCounter()}:  ${obj.nextGame}</div>
        			`;
		modalmessage.appendChild(messageElement);
		modalmessage.scrollTop = modalmessage.scrollHeight;

	}
	const gameMessage = document.getElementById("game-modal") ?? null;
	if (gameMessage) {
		gameMessage.classList.remove("hidden");
	}
}
