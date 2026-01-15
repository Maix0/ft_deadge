import { addMessage } from "./addMessage";
import { getUser } from "@app/auth";

export function cmdList() {

    addMessage('*');
	addMessage('** ********** List of @cmds ********** **');
	addMessage('\'@cls\' - clear chat screen conversations');
	addMessage('\'@profile <name>\' - pulls ups user profile');
	addMessage('\'@block <name>\' - blocks / unblock user');
	const guestflag = getUser()?.guest;
	if(!guestflag) {
		addMessage('\'@guest\' - guest broadcast msgs on / off');
	}
	addMessage('\'@notify\' - toggles notifications on / off');
	addMessage('\'@quit\' - disconnect user from the chat');
	addMessage('\'@pong\' - displays your pong match results');
	addMessage('\'@ttt\' - displays your ttt match results');
	addMessage('** ********** function keys ********** **');
	addMessage('\'ESC\' - chat box display toggles off');
	addMessage('\'F2\' - chat box display toggles on');
	addMessage('\'F4\' - navigates to Pong Box');
	addMessage('\'F8\' - navigates to TTT Box');
	addMessage('\'F9\' - navigates to Home Page');
	addMessage('** *********************************** **');
	addMessage('*');
}