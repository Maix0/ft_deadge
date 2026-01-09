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
	addMessage('** *********************************** **');
	addMessage('*');
}