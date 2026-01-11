import { Socket } from "socket.io-client";
import { isLoggedIn } from "./isLoggedIn";
import { showError } from "@app/toast";
import { updateUser } from "@app/auth";

/**
 * function displays who is logged in the chat in the ping-Bubbies window 
 * @param socket 
*/

export async function connected(socket: Socket): Promise<void> {
	
	const buddies = document.getElementById('div-buddies') as HTMLDivElement;
	setTimeout(async () => {
		try {
			let oldUser = localStorage.getItem("oldName") ?? "";
			let user = await updateUser();
			const loggedIn = isLoggedIn();
			if (!loggedIn) throw('Not Logged in');
			if (loggedIn?.name === undefined) {return ;};
			oldUser =  loggedIn.name ?? "";
			localStorage.setItem("oldName", oldUser);
			socket.emit('list', {
				oldUser: oldUser,
				user: user?.name,
			});
			socket.connect();
		} catch (e) {
			buddies.textContent = "";
			socket.disconnect();
		}
	}, 16);
};