import { Socket } from "socket.io-client";
import { isLoggedIn } from "./isLoggedIn";
import { showError } from "@app/toast";
import { updateUser } from "@app/auth";

/**
 * function displays who is logged in the chat in the ping-Bubbies window 
 * @param socket 
 */

export async function connected(socket: Socket): Promise<void> {

	setTimeout(async () => {
		try {
				const buddies = document.getElementById('div-buddies') as HTMLDivElement;
				const loggedIn = isLoggedIn();
				if (!loggedIn) throw('Not Logged in');
				let oldUser = localStorage.getItem("oldName") ?? "";
				if (loggedIn?.name === undefined) {return ;};
				oldUser =  loggedIn.name ?? "";
				let user = await updateUser();
				localStorage.setItem("oldName", oldUser);
				buddies.textContent = "";
				socket.emit('list', {
					oldUser: oldUser,
					user: user?.name,
				});
			} catch (e) {
				showError('Failed to login: Unknown error');
			}
		}, 16);
};