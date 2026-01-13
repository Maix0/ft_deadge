import { showError } from "@app/toast";
import { windowStateVisable } from "./windowStateVisable";
import { windowStateHidden } from "./windowStateHidden";

/**
 * function to quit the chat - leaves the ping-Buddies list
 * 
*/

export async function quitChat () {
	const chatBox = document.getElementById("chatBox")!;
	const overlay = document.querySelector('#overlay')!;
	const chatMessageIn = document.querySelector("#chatMessageIn");

	try {
		if (chatBox.classList.contains('hidden')) {
			// chatBox.classList.toggle('hidden');
			// overlay.classList.add('opacity-60');
			await windowStateVisable();
			
		} else {
			await windowStateHidden();
			chatBox.classList.toggle('hidden');
			overlay.classList.remove('opacity-60');
			chatMessageIn?.classList.remove("hidden");
			chatMessageIn!.textContent = '';
		}
	} catch (e) {
		showError('Failed to Quit Chat: Unknown error');
	}
	
};
