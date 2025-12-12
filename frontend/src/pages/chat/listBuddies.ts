import { getUser } from "@app/auth";
import { Socket } from 'socket.io-client';
import { getProfil } from './getProfil';

/**
 * function adds a user to the ping Buddies window\
 * it also acts as click or double click\ 
 * activates two possible actions:\
 * click => private Mag\
 * dbl click => get Profil of the name\ 
 * collected in the clipBoard
 * @param socket 
 * @param buddies 
 * @param listBuddies 
 * @returns 
 */

export async function listBuddies(socket: Socket, buddies: HTMLDivElement, listBuddies: string) {

	if (!buddies) return;
	const sendtextbox = document.getElementById('t-chat-window') as HTMLButtonElement;
	const buddiesElement = document.createElement("div-buddies-list");
	buddiesElement.textContent = listBuddies + '\n';
	const user = getUser()?.name ?? ""; 
	buddies.appendChild(buddiesElement);
	buddies.scrollTop = buddies.scrollHeight;
	console.log(`Added buddies: ${listBuddies}`);

	buddiesElement.style.cursor = "pointer";
	buddiesElement.addEventListener("click", () => {
		navigator.clipboard.writeText(listBuddies);
		if (listBuddies !== user && user !== "") {
			sendtextbox.value = `@${listBuddies}: `;
			console.log("Copied to clipboard:", listBuddies);
			sendtextbox.focus();
		} 
	});

	buddiesElement.addEventListener("dblclick", () => {
		console.log("Open profile:", listBuddies);
		getProfil(socket, listBuddies);
        sendtextbox.value = "";
    });

}
