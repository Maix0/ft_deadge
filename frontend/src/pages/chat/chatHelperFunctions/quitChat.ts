import { Socket } from "socket.io-client";
import { getSocket } from "../chat";
import { logout } from "./logout";
import { connected } from "./connected";
import { showError } from "@app/toast";
import { setTitle } from "@app/routing";

/**
 * function to quit the chat - leaves the ping-Buddies list
 * @param socket 
 */

export function quitChat (socket: Socket) {

	try {
		const systemWindow = document.getElementById('system-box') as HTMLDivElement;
		const chatWindow = document.getElementById("t-chatbox") as HTMLDivElement;
		if (socket) {
			logout(socket);
			setTitle('Chat Page');
			connected(socket);
		} else {
			getSocket();
		}
	} catch (e) {
		showError('Failed to Quit Chat: Unknown error');
	}

};