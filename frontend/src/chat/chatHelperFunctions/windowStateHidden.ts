import { updateUser } from "@app/auth";

export async function windowStateHidden() {		
	console.log('--------------------------')
	console.log('WindowState Hidden Called');
	console.log('--------------------------')
	const socketId = window.__state.chatSock || undefined;
	// let oldName = localStorage.getItem("oldName") ??  undefined;
	let oldName: string;
	if (socketId === undefined) return;
	let userName = await updateUser();
	oldName =  userName?.name ?? "";
	if (oldName === "") return;
	localStorage.setItem('oldName', oldName);
	socketId.emit('client_left', {
		user: userName?.name,
		why: 'tab window hidden - socket not dead',
	});	
	return;
};