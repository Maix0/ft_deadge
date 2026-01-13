import { setTitle } from "@app/routing";
import { updateUser } from "@app/auth";

/**
 * function stores old name clears ping buddies list
 * and emit a client entered to backend 
 * @returns 
 */

export async function windowStateVisable() {
	
	const buddies = document.getElementById('div-buddies') as HTMLDivElement;
	const socketId = window.__state.chatSock || undefined;
	let oldName = localStorage.getItem("oldName") || undefined;

	if (socketId === undefined || oldName === undefined) {return;};
	let user = await updateUser();
	if(user === null) return;
	socketId.emit('client_entered', {
		userName: oldName,
		user: user?.name,
	});
	buddies.innerHTML = '';
	buddies.textContent = '';
	return;
};
