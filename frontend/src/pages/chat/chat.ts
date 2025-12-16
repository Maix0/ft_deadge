import { addRoute, setTitle, type RouteHandlerParams, type RouteHandlerReturn } from "@app/routing";
import { showError } from "@app/toast";
import authHtml from './chat.html?raw';
import client from '@app/api'
import { getUser, updateUser } from "@app/auth";
import io, { Socket } from 'socket.io-client';
import { listBuddies } from './listBuddies';
import { getProfil } from './getProfil';
import { addMessage } from './addMessage';
import { broadcastMsg } from './broadcastMsg';
import { isLoggedIn } from './isLoggedIn';
import type { ClientMessage, ClientProfil } from './types_front';
import { openProfilePopup } from './openProfilePopup';
import { actionBtnPopUpClear } from './actionBtnPopUpClear';
import { actionBtnPopUpBlock } from './actionBtnPopUpBlock';
import { windowStateHidden } from './windowStateHidden';

export const color = {
	red: 'color: red;',
	green: 'color: green;',
	yellow: 'color: orange;',
	blue: 'color: blue;',
	reset: '',
};

// get the name of the machine used to connect
const machineHostName = window.location.hostname;
console.log('connect to login at %chttps://' + machineHostName + ':8888/app/login',color.yellow);

export let __socket: Socket | undefined = undefined;
document.addEventListener('ft:pageChange', () => {
	if (__socket !== undefined)
		__socket.close();
	__socket = undefined;
	console.log("Page changed");
});

export function getSocket(): Socket {
	let addressHost = `wss://${machineHostName}:8888`;
	// let addressHost = `wss://localhost:8888`;
	if (__socket === undefined)

		__socket = io(addressHost, {
			path: "/api/chat/socket.io/",
			secure: false,
			transports: ["websocket"],
		});
	return __socket;
};

function inviteToPlayPong(profil: ClientProfil, senderSocket: Socket) {
	profil.SenderName = getUser()?.name ?? '';
	if (profil.SenderName === profil.user) return;
	addMessage(`You invited to play: ${profil.user}🏓`)
	senderSocket.emit('inviteGame', JSON.stringify(profil));
};

function actionBtnPopUpInvite(invite: ClientProfil, senderSocket: Socket) {
		setTimeout(() => {
			const InvitePongBtn = document.querySelector("#popup-b-invite");
			InvitePongBtn?.addEventListener("click", () => {
				inviteToPlayPong(invite, senderSocket);
			});
    	}, 0)
};

// async function windowStateHidden() {
// 	const socketId = __socket || undefined;
// 	// let oldName = localStorage.getItem("oldName") ??  undefined;
// 	let oldName: string;
// 	if (socketId === undefined) return;
// 	let userName = await updateUser();
// 	oldName =  userName?.name ?? "";
// 	if (oldName === "") return;
// 	localStorage.setItem('oldName', oldName);
// 	socketId.emit('client_left', {
// 		user: userName?.name,
// 		why: 'tab window hidden - socket not dead',
// 	});
// 	return;
// };

async function windowStateVisable() {

	const buddies = document.getElementById('div-buddies') as HTMLDivElement;
	const socketId = __socket || undefined;
	let oldName = localStorage.getItem("oldName") || undefined;
	console.log("%c WINDOW VISIBLE - oldName :'" + oldName + "'", color.green);

	if (socketId === undefined || oldName === undefined) {console.log("%SOCKET ID", color.red); return;}
	let user = await updateUser();
	if(user === null) return;
	console.log("%cUserName :'" + user?.name + "'", color.green);
	socketId.emit('client_entered', {
		userName: oldName,
		user: user?.name,
	});
	buddies.innerHTML = '';
	buddies.textContent = '';
	//connected(socketId);
	setTitle('Chat Page');
	return;
};

function parseCmdMsg(msgText: string): string[] | undefined {

	if (!msgText?.trim()) return;
    msgText = msgText.trim();
    const command: string[] = ['', ''];
    if (!msgText.startsWith('@')) {
        command[0] = '@msg';
        command[1] = msgText;
        return command;
    }
    const noArgCommands = ['@quit', '@who', '@cls'];
    if (noArgCommands.includes(msgText)) {
        command[0] = msgText;
        command[1] = '';
        return command;
    }

	const ArgCommands = ['@profil', '@block'];
	const userName = msgText.indexOf(" ");
	const cmd2 = msgText.slice(0, userName).trim() ?? "";
	const user = msgText.slice(userName + 1).trim();
	if (ArgCommands.includes(cmd2)) {
    	    command[0] = cmd2;
    	    command[1] = user;
    	    return command;
	}
	const colonIndex = msgText.indexOf(":");
    if (colonIndex === -1) {
        command[0] = msgText;
        command[1] = '';
        return command;
    }
    const cmd = msgText.slice(0, colonIndex).trim();
    const rest = msgText.slice(colonIndex + 1).trim();
    command[0] = cmd;
    command[1] = rest;
    return command;
}

// async function listBuddies(socket: Socket, buddies: HTMLDivElement, listBuddies: string) {

// 	if (!buddies) return;
// 	const sendtextbox = document.getElementById('t-chat-window') as HTMLButtonElement;
// 	const buddiesElement = document.createElement("div-buddies-list");
// 	buddiesElement.textContent = listBuddies + '\n';
// 	const user = getUser()?.name ?? "";
// 	buddies.appendChild(buddiesElement);
// 	buddies.scrollTop = buddies.scrollHeight;
// 	console.log(`Added buddies: ${listBuddies}`);

// 	buddiesElement.style.cursor = "pointer";
// 	buddiesElement.addEventListener("click", () => {
// 		navigator.clipboard.writeText(listBuddies);
// 		if (listBuddies !== user && user !== "") {
// 			sendtextbox.value = `@${listBuddies}: `;
// 			console.log("Copied to clipboard:", listBuddies);
// 			sendtextbox.focus();
// 		}
// 	});

// 	buddiesElement.addEventListener("dblclick", () => {
// 		console.log("Open profile:", listBuddies);
// 		getProfil(socket, listBuddies);
//         sendtextbox.value = "";
//     });

// }


function waitSocketConnected(socket: Socket): Promise<void> {
    return new Promise(resolve => {
        if (socket.connected) return resolve();
        socket.on("connect", () => resolve());
    });
};

function quitChat (socket: Socket) {

	try {
		const systemWindow = document.getElementById('system-box') as HTMLDivElement;
		const chatWindow = document.getElementById("t-chatbox") as HTMLDivElement;
		if (socket) {
			logout(socket);
			setTitle('Chat Page');
			systemWindow.innerHTML = "";
			chatWindow.textContent = "";
			connected(socket);
		} else {
			getSocket();
		}
	} catch (e) {
		console.error("Quit Chat error:", e);
		showError('Failed to Quit Chat: Unknown error');
	}

};

// const bconnected = document.getElementById('b-help') as HTMLButtonElement;
// if (bconnected) {
// 	bconnected.click();
// }

function logout(socket: Socket) {
  socket.emit("logout");  // notify server
  socket.disconnect();    // actually close the socket
  localStorage.clear();
  if (__socket !== undefined)
		__socket.close();
//   window.location.href = "/login";
};


async function connected(socket: Socket): Promise<void> {

	try {
			const buddies = document.getElementById('div-buddies') as HTMLDivElement;
			const loggedIn = isLoggedIn();
			if (!loggedIn) throw('Not Logged in');
			console.log('%cloggedIn:',color.blue, loggedIn?.name);
			let oldUser = localStorage.getItem("oldName") ?? "";
			console.log('%coldUser:',color.yellow, oldUser);
			if (loggedIn?.name === undefined) {console.log('');return ;}
			setTimeout(() => {
				oldUser =  loggedIn.name ?? "";
			}, 0);
			// const res = await client.guestLogin();
			let user = await updateUser();
			console.log('%cUser?name:',color.yellow, user?.name);
			localStorage.setItem("oldName", oldUser);
			buddies.textContent = "";
			socket.emit('list', {
				oldUser: oldUser,
				user: user?.name,
			});
	} catch (e) {
		console.error("Login error:", e);
		showError('Failed to login: Unknown error');
	}
};

async function whoami(socket: Socket) {
	try {
		const chatWindow = document.getElementById("t-chatbox") as HTMLDivElement;
		const loggedIn = isLoggedIn();

		const res = (getUser());
		console.log('loginGuest():', res?.name);
		if (res) {
				let user = await updateUser();
				if (chatWindow) {
					socket.emit('updateClientName', {
						oldUser: '',
						user: user?.name
					});
				}
				if (user === null)
					return showError('Failed to get user: no user ?');
				setTitle(`Welcome ${user.guest ? '[GUEST] ' : ''}${user.name}`);
			} else {
				showError(`Failed to login: ${res}`);
			}

	} catch (e) {
		console.error("Login error:", e);
		showError('Failed to login: Unknown error');
	}
};

// async function openProfilePopup(profil: ClientProfil) {


// 	const modalname = document.getElementById("modal-name") ?? null;
// 	if (modalname)
// 		modalname.innerHTML = `
// 					<div class="profile-info">
// 						<div-profil-name id="profilName"> Profil of ${profil.user} </div>
// 						<div-login-name id="loginName"> Login Name: '${profil.loginName ?? 'Guest'}' </div>
// 						</br>
// 						<div-login-name id="loginName"> Login ID: '${profil.userID ?? ''}' </div>
// 						</br>
// 						<button id="popup-b-clear" class="btn-style popup-b-clear">Clear Text</button>
// 						<button id="popup-b-invite" class="btn-style popup-b-invite">U Game ?</button>
// 						<button id="popup-b-block" class="btn-style popup-b-block">Block User</button>
//             			<div id="profile-about">About: '${profil.text}' </div>
//         			</div>
// 	`;
// 	const profilList = document.getElementById("profile-modal") ?? null;
// 	if (profilList)
// 		profilList.classList.remove("hidden");
// 	 // The popup now exists → attach the event
// }

let count = 0;
function incrementCounter(): number {
	count += 1;
	return count;
}

async function openMessagePopup(message: string) {

	const modalmessage = document.getElementById("modal-message") ?? null;
	if(!message) return
	const obj:any =  JSON.parse(message);
	if (modalmessage) {
		const messageElement = document.createElement("div");
		messageElement.innerHTML = `
					<div class="profile-info">
            			<div id="profile-about">Next Game Message ${incrementCounter()}:  ${obj.link}</div>
        			</div>`;
		modalmessage.appendChild(messageElement);
		modalmessage.scrollTop = modalmessage.scrollHeight;

	}
	const gameMessage = document.getElementById("game-modal") ?? null;
	if (gameMessage)
		gameMessage.classList.remove("hidden");
	 // The popup now exists → attach the event
}




function handleChat(_url: string, _args: RouteHandlerParams): RouteHandlerReturn {


	let socket = getSocket();

	// Listen for the 'connect' event
	socket.on("connect", async () => {

		const systemWindow = document.getElementById('system-box') as HTMLDivElement;
		await waitSocketConnected(socket);
		console.log("I AM Connected to the server:", socket.id);
		const user = getUser()?.name;
		// Ensure we have a user AND socket is connected
		if (!user || !socket.connected) return;
		const message = {
			command: "",
			destination: 'system-info',
			type: "chat",
			user,
			token: document.cookie ?? "",
			text: " has Just ARRIVED in the chat",
			timestamp: Date.now(),
			SenderWindowID: socket.id,
		};
		socket.emit('message', JSON.stringify(message));
		const messageElement = document.createElement("div");
    	messageElement.textContent = `${user}: is connected au server`;
    	systemWindow.appendChild(messageElement);
		systemWindow.scrollTop = systemWindow.scrollHeight;
	});

	// Listen for messages from the server "MsgObjectServer"
	socket.on("MsgObjectServer", (data: { message: ClientMessage}) => {
		// Display the message in the chat window
		const systemWindow = document.getElementById('system-box') as HTMLDivElement;
		const chatWindow = document.getElementById("t-chatbox") as HTMLDivElement;
		const bconnected = document.getElementById('b-help') as HTMLButtonElement;

		if (bconnected) {
			connected(socket);
		}

		if (chatWindow && data.message.destination === "") {
			const messageElement = document.createElement("div");
			messageElement.textContent = `${data.message.user}: ${data.message.text}`;
			chatWindow.appendChild(messageElement);
			chatWindow.scrollTop = chatWindow.scrollHeight;
		}
		if (chatWindow && data.message.destination === "privateMsg") {
			const messageElement = document.createElement("div-private");
			messageElement.textContent = `🔒${data.message.user}: ${data.message.text}`;
			chatWindow.appendChild(messageElement);
			chatWindow.scrollTop = chatWindow.scrollHeight;
		}


		const MAX_SYSTEM_MESSAGES = 10;

		if (systemWindow && data.message.destination === "system-info") {
    		const messageElement = document.createElement("div");
    		messageElement.textContent = `${data.message.user}: ${data.message.text}`;
    		systemWindow.appendChild(messageElement);

    		// keep only last 10
    		while (systemWindow.children.length > MAX_SYSTEM_MESSAGES) {
    		    systemWindow.removeChild(systemWindow.firstChild!);
    		}
    		systemWindow.scrollTop = systemWindow.scrollHeight;
		}
		console.log("Getuser():", getUser());
	});

	socket.on('profilMessage', (profil: ClientProfil) => {
		openProfilePopup(profil);
		actionBtnPopUpClear(profil, socket);
		actionBtnPopUpInvite(profil, socket);
		actionBtnPopUpBlock(profil, socket);
	});

	socket.on('inviteGame', (invite: ClientProfil) => {
		const chatWindow = document.getElementById("t-chatbox") as HTMLDivElement;
		const messageElement = document.createElement("div");
    	messageElement.innerHTML =`🏓${invite.SenderName}:  ${invite.innerHtml}`;
    	chatWindow.appendChild(messageElement);
		chatWindow.scrollTop = chatWindow.scrollHeight;
	});


	socket.on('blockUser', (blocked: ClientProfil) => {
		let icon = '⛔';
		const chatWindow = document.getElementById("t-chatbox") as HTMLDivElement;
		const messageElement = document.createElement("div");
		if (`${blocked.text}` === '\'I have un-blocked you\'' ) { icon = '💚'};
    	messageElement.innerText =`${icon}${blocked.SenderName}:  ${blocked.text}`;
    	chatWindow.appendChild(messageElement);
		chatWindow.scrollTop = chatWindow.scrollHeight;
	});




	socket.on('logout', () => {
		quitChat(socket);
	});

	socket.on('privMessageCopy', (message) => {
		addMessage(message);
	})

	//receives broadcast of the next GAME
	socket.on('nextGame', (message: string) => {
		openMessagePopup(message);
		// addMessage(message);
	})

	let toggle = false
	window.addEventListener("focus", async () => {
		//nst bwhoami = document.getElementById('b-whoami') as HTMLButtonElement;

		setTimeout(() => {
			connected(socket);
		}, 0);
		if (window.location.pathname === '/app/chat') {
			console.log('%cWindow is focused on /chat:' + socket.id, color.green);
			if (socket.id) {
				await windowStateVisable();
			}
			toggle = true;
		}
	});

	window.addEventListener("blur", () => {
		console.log('%cWindow is not focused on /chat', color.red);
		if (socket.id)
			windowStateHidden();
		toggle = false;
	});

	// setInterval(async () => {
	// 	//connected(socket);
	// },10000); // every 10 sec

	socket.on('listBud', async (myBuddies: string)  => {
		const buddies = document.getElementById('div-buddies') as HTMLDivElement;
		console.log('%cList buddies connected ',color.yellow, myBuddies);
		listBuddies(socket, buddies, myBuddies);
	});

	socket.once('welcome', (data) => {
		const buddies = document.getElementById('div-buddies') as HTMLDivElement;
		const chatWindow = document.getElementById('t-chatbox') as HTMLDivElement;
		chatWindow.innerHTML = '';
		buddies.textContent = '';
		buddies.innerHTML = '';
		connected(socket);
		addMessage (`${data.msg}  ` + getUser()?.name);
	});


	setTitle('Chat Page');
	// Listen for the 'connect' event
	return {

		html: authHtml, postInsert: async (app) => {
			const sendButton = document.getElementById('b-send') as HTMLButtonElement;
			const chatWindow = document.getElementById('t-chatbox') as HTMLDivElement;
			const sendtextbox = document.getElementById('t-chat-window') as HTMLButtonElement;
			const clearText = document.getElementById('b-clear') as HTMLButtonElement;
			const bwhoami = document.getElementById('b-whoami') as HTMLButtonElement;
			const bconnected = document.getElementById('b-help') as HTMLButtonElement;
			const username = document.getElementById('username') as HTMLDivElement;
			const buddies = document.getElementById('div-buddies') as HTMLDivElement;
			const bquit = document.getElementById('b-quit') as HTMLDivElement;
			const systemWindow = document.getElementById('system-box') as HTMLDivElement;
			const bnextGame = document.getElementById('b-nextGame') as HTMLDivElement;

			chatWindow.textContent = '';
			chatWindow.innerHTML = '';
			buddies.textContent = '';
			buddies.innerHTML = '';

			const buttonPro = document.getElementById("close-modal") ?? null;

			if (buttonPro)
				buttonPro.addEventListener("click", () => {
  				const profilList = document.getElementById("profile-modal") ?? null;
				if (profilList) profilList.classList.add("hidden");
			});




			const buttonMessage = document.getElementById("close-modal-message") ?? null;

			if (buttonMessage)
				buttonMessage.addEventListener("click", () => {
  				const gameMessage = document.getElementById("game-modal") ?? null;
				if (gameMessage) gameMessage.classList.add("hidden");
				const modalmessage = document.getElementById("modal-message") ?? null;
				if (modalmessage) {modalmessage.innerHTML = "";}

			});


			// Send button
			sendButton?.addEventListener("click", () => {
				if (sendtextbox && sendtextbox.value.trim()) {
					let msgText: string = sendtextbox.value.trim();
					const msgCommand = parseCmdMsg(msgText) ?? "";
					connected(socket);
					if (msgCommand !== "") {
						switch (msgCommand[0]) {
							case '@msg':
								broadcastMsg(socket, msgCommand);
								break;
    						case '@who':
								whoami(socket);
								break;
							case '@profil':
								getProfil(socket, msgCommand[1]);
								break;
    						case '@cls':
    						    chatWindow.innerHTML = '';
    						    break;
							case '@quit':
								quitChat(socket);
    						    break;
    						default:
								const user = getUser()?.name;
								// Ensure we have a user AND socket is connected
								if (!user || !socket.connected) return;
								const message = {
									command: msgCommand[0],
									destination: '',
									type: "chat",
									user: user,
									token: document.cookie ?? "",
									text: msgCommand[1],
									timestamp: Date.now(),
									SenderWindowID: socket.id,
								};
								//socket.emit('MsgObjectServer', message);
								socket.emit('privMessage', JSON.stringify(message));
    						    // addMessage(JSON.stringify(message));
    						    break;
						}
						// Clear the input in all cases
						sendtextbox.value = "";
					}
				}
			});

			// Clear Text button
			clearText?.addEventListener("click", () => {
				if (chatWindow) {
					chatWindow.innerHTML = '';
				}
				//clearChatWindow(socket); //DEV testing broadcastGames
			});

			// Dev Game message button
			bnextGame?.addEventListener("click", () => {
				if (chatWindow) {
					socket.emit('nextGame');
				}
			});

			bquit?.addEventListener('click', () => {
				quitChat(socket);
			});

			// Enter key to send message
			sendtextbox!.addEventListener('keydown', (event) => {
				if (event.key === 'Enter') {
					sendButton?.click();
				}
			});

			// Whoami button to display user name					addMessage(msgCommand[0]);

			bwhoami?.addEventListener('click', async () => {
				whoami(socket);
			});
		}
	}
};
addRoute('/chat', handleChat, { bypass_auth: true });