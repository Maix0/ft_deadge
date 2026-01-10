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
 * @param bud 
 * @returns 
 */

export async function listBuddies(socket: Socket, buddies: HTMLDivElement, listBuddies: string[]) {

	buddies.innerHTML = "";
	for (const bud of listBuddies)
	{
		if (!buddies) return;
		const sendtextbox = document.getElementById('t-chat-window') as HTMLButtonElement;
		const buddiesElement = document.createElement("div-buddies-list");
		buddiesElement.textContent = bud + '\n';
		const user = getUser()?.name ?? ""; 
		buddies.appendChild(buddiesElement);
		buddies.scrollTop = buddies.scrollHeight;

		buddiesElement.style.cursor = "pointer";
		buddiesElement.addEventListener("click", () => {
			navigator.clipboard.writeText(bud);
			if (bud !== user && user !== "") {
				sendtextbox.value = `@${bud}: `;
				sendtextbox.focus();
			} 
		});
		buddiesElement.addEventListener("dblclick", () => {
			getProfil(socket, bud);
			sendtextbox.value = "";
		});
	}
}
