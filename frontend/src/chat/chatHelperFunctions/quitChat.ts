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
	const chatBox = document.getElementById("chatBox")!;
	const overlay = document.querySelector('#overlay')!;
	
	try {
		if (chatBox.classList.contains('hidden')) {
			// chatBox.classList.toggle('hidden');
			// overlay.classList.add('opacity-60');
		} else {
			chatBox.classList.toggle('hidden');
			overlay.classList.remove('opacity-60');
		}
	} catch (e) {
		showError('Failed to Quit Chat: Unknown error');
	}
	
};