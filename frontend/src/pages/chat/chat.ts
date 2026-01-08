import './chat.css';
import { addRoute, setTitle, type RouteHandlerParams, type RouteHandlerReturn } from "@app/routing";
import { showError } from "@app/toast";
import authHtml from './chat.html?raw';
import { getUser, updateUser } from "@app/auth";
import io, { Socket } from 'socket.io-client';
import { listBuddies } from './chatHelperFunctions/listBuddies';
import { getProfil } from './chatHelperFunctions/getProfil';
import { addMessage } from './chatHelperFunctions/addMessage';
import { broadcastMsg } from './chatHelperFunctions/broadcastMsg';
import { isLoggedIn } from './chatHelperFunctions/isLoggedIn';
import type { ClientMessage, ClientProfil } from './types_front';
import { openProfilePopup } from './chatHelperFunctions/openProfilePopup';
import { actionBtnPopUpBlock } from './chatHelperFunctions/actionBtnPopUpBlock';
import { windowStateHidden } from './chatHelperFunctions/windowStateHidden';
import type { blockedUnBlocked, obj } from './types_front';
import { blockUser } from './chatHelperFunctions/blockUser';

const MAX_SYSTEM_MESSAGES = 10;
let inviteMsgFlag: boolean = false;
export let noGuestFlag: boolean = false;
const machineHostName = window.location.hostname;

export let __socket: Socket | undefined = undefined;
document.addEventListener('ft:pageChange', () => {
	if (__socket !== undefined)
		__socket.close();
	__socket = undefined;
	console.log("Page changed");
});

export function getSocket(): Socket {
	let addressHost = `wss://${machineHostName}:8888`;
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

async function windowStateVisable() {

	const buddies = document.getElementById('div-buddies') as HTMLDivElement;
	const socketId = __socket || undefined;
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
    const noArgCommands = ['@quit', '@help', '@cls'];
    if (noArgCommands.includes(msgText)) {
        command[0] = msgText;
        command[1] = '';
        return command;
    }

	const ArgCommands = ['@profile', '@block'];
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
			connected(socket);
		} else {
			getSocket();
		}
	} catch (e) {
		showError('Failed to Quit Chat: Unknown error');
	}

};

function logout(socket: Socket) {
  socket.emit("logout");  // notify server
  socket.disconnect();    // actually close the socket
  localStorage.clear();
  if (__socket !== undefined)
		__socket.close();
};


async function connected(socket: Socket): Promise<void> {

	setTimeout(async () => {
	try {
			const buddies = document.getElementById('div-buddies') as HTMLDivElement;
			const loggedIn = isLoggedIn();
			if (!loggedIn) throw('Not Logged in');
			let oldUser = localStorage.getItem("oldName") ?? "";
			if (loggedIn?.name === undefined) {return ;};
				oldUser =  loggedIn.name ?? "";
				// const res = await client.guestLogin();
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
		
let count = 0;
function incrementCounter(): number {
	count += 1;
	return count;
}

async function openMessagePopup(message: string) {

	const modalmessage = document.getElementById("modal-message") ?? null;
	if(!message) return
	const obj =  JSON.parse(message);
	if (modalmessage) {
		const messageElement = document.createElement("div");
		messageElement.innerHTML = `
					<div class="profile-info"
            			<div id="profile-about">Next Game Message ${incrementCounter()}:  ${obj.link}</div>
        			</div>`;
		modalmessage.appendChild(messageElement);
		modalmessage.scrollTop = modalmessage.scrollHeight;

	}
	const gameMessage = document.getElementById("game-modal") ?? null;
	if (gameMessage) {
		gameMessage.classList.remove("hidden");
	}
}

function handleChat(_url: string, _args: RouteHandlerParams): RouteHandlerReturn {
	let socket = getSocket();
	let blockMessage: boolean;
		// Listen for the 'connect' event
		socket.on("connect", async () => {
			const systemWindow = document.getElementById('system-box') as HTMLDivElement;
			const sendtextbox = document.getElementById('t-chat-window') as HTMLButtonElement;
			const noGuest = document.getElementById("noGuest") ?? null;

			await waitSocketConnected(socket);
			const user = getUser()?.name;
			const userID = getUser()?.id;
			// Ensure we have a user AND socket is connected
			if (!user || !socket.connected || !noGuest) return;
			const message = {
				command: "",
				destination: 'system-info',
				type: "chat",
				user,
				token: document.cookie ?? "",
				text: " has Just ARRIVED in the chat",
				timestamp: Date.now(),
				SenderWindowID: socket.id,
				SenderID: userID,
			};
			socket.emit('message', JSON.stringify(message));
			const guest = getUser()?.guest;
			if (guest) {noGuestFlag = false; noGuest.innerText = ''; sendtextbox.value = ''; return;};
			const messageElement = document.createElement("div");
    		messageElement.textContent = `${user}: is connected au server`;
    		systemWindow.appendChild(messageElement);
			systemWindow.scrollTop = systemWindow.scrollHeight;
		});

	// Listen for messages from the server "MsgObjectServer"
	socket.on("MsgObjectServer", (data: { message: ClientMessage}) => {
		const systemWindow = document.getElementById('system-box') as HTMLDivElement;
		const chatWindow = document.getElementById("t-chatbox") as HTMLDivElement;
		
		if (socket) {
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

		if (chatWindow && data.message.destination === "inviteMsg") {
			const messageElement = document.createElement("div-private");
			const chatWindow = document.getElementById("t-chatbox") as HTMLDivElement;
			messageElement.innerHTML = `🏓${data.message.SenderUserName}: ${data.message.innerHtml}`;
	    	chatWindow.appendChild(messageElement);
			chatWindow.scrollTop = chatWindow.scrollHeight;
		}

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
	});

	socket.on('profilMessage', (profil: ClientProfil) => {
		profil.SenderID = getUser()?.id ?? "";
		profil.SenderName = getUser()?.name ?? "";
		openProfilePopup(profil);
		socket.emit('isBlockdBtn', profil);
		socket.emit('check_Block_button', profil);
		actionBtnPopUpInvite(profil, socket);
		actionBtnPopUpBlock(profil, socket);
	});

	socket.on('blockUser', (blocked: ClientProfil) => {
		let icon = '⛔';
		if (inviteMsgFlag) {
			const chatWindow = document.getElementById("t-chatbox") as HTMLDivElement;
			const messageElement = document.createElement("div");
			if (`${blocked.text}` === 'I have un-blocked you' ) {icon = '💚'};
    		messageElement.innerText =`${icon}${blocked.SenderName}:  ${blocked.text}`;
    		chatWindow.appendChild(messageElement);
			chatWindow.scrollTop = chatWindow.scrollHeight;
		}
	});

	socket.on('blockBtn', (data: blockedUnBlocked) => {
		const blockUserBtn = document.querySelector("#popup-b-block");
		if (blockUserBtn) {
			let message = "";
			if (data.userState === "block") {message = "un-block", blockMessage = true} else{message = "block", blockMessage = false}
			blockUserBtn.textContent = message;
		}
	});

	socket.on('logout', () => {
		quitChat(socket);
	});

	socket.on('privMessageCopy', (message: string) => {
		addMessage(message);
	})

	//receives broadcast of the next GAME
	socket.on('nextGame', (message: string) => {
		openMessagePopup(message);
	})

	let toggle = false
	window.addEventListener("focus", async () => {

		setTimeout(() => {
			connected(socket);
		}, 16);
		if (window.location.pathname === '/app/chat') {
			if (socket.id) {
				await windowStateVisable();
			}
			toggle = true;
		}
	});

	window.addEventListener("blur", () => {
		if (socket.id)
			windowStateHidden();
		toggle = false;
	});

	socket.on('listBud', async (myBuddies: string[])  => {
		const buddies = document.getElementById('div-buddies') as HTMLDivElement;
		listBuddies(socket, buddies, myBuddies);
	});

	socket.once('welcome', (data) => {
		const buddies = document.getElementById('div-buddies') as HTMLDivElement;
		const chatWindow = document.getElementById('t-chatbox') as HTMLDivElement;
		buddies.textContent = '';
		buddies.innerHTML = '';
		connected(socket);
		addMessage (`${data.msg}  ` + getUser()?.name);
	});
	setTitle('Chat Page');

	return {

		html: authHtml, postInsert: async (app) => {
			const sendButton = document.getElementById('b-send') as HTMLButtonElement;
			const chatWindow = document.getElementById('t-chatbox') as HTMLDivElement;
			const sendtextbox = document.getElementById('t-chat-window') as HTMLButtonElement;
			const clearText = document.getElementById('b-clear') as HTMLButtonElement;
			const buddies = document.getElementById('div-buddies') as HTMLDivElement;
			const bquit = document.getElementById('b-quit') as HTMLDivElement;
			const bnextGame = document.getElementById('b-nextGame') as HTMLDivElement;

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
				const notify = document.getElementById("notify") ?? null;
				const noGuest = document.getElementById("noGuest") ?? null;
				const userId = getUser()?.id;
				const userAskingToBlock = getUser()?.name;
				if (sendtextbox && sendtextbox.value.trim()) {
					let msgText: string = sendtextbox.value.trim();
					const msgCommand = parseCmdMsg(msgText) ?? "";
					connected(socket);
					if (msgCommand !== "") {
						switch (msgCommand[0]) {
							case '@msg':
								broadcastMsg(socket, msgCommand);
								break;
							case '@block':
								if (msgCommand[1] === '') {break;};
								if (!userAskingToBlock) return;
								if (!userId) return;
								const userToBlock: ClientProfil = {
									command: msgCommand[0],
    								destination: '',
    								type:  'chat',
    								user:  msgCommand[1],
    								loginName:  '',
    								userID:  userId,
    								text:  '',
    								timestamp:  Date.now(),
    								SenderWindowID:  '',
    								SenderName:  userAskingToBlock,
    								SenderID:  '',
    								Sendertext:  '',
    								innerHtml:  '',
								}
								blockUser(userToBlock, socket);
								break;
    						case '@notify':
								if (notify === null) {break;};
								if (inviteMsgFlag === false) {
									notify.innerText = '🔔';
									inviteMsgFlag = true;
								} else {
									notify.innerText = '🔕';
									inviteMsgFlag = false;
								}

								break;
								
								case '@guest':
									if (!userId) return;
									if (!userAskingToBlock) return;
									if (noGuest === null) {break;};
									const guest = getUser()?.guest;
									if (noGuestFlag === false) {
										noGuest.innerText = '❤️​';
										noGuestFlag = true;
									} else {
										noGuest.innerText = '💔';
										noGuestFlag = false;
									}
									if (guest) {noGuestFlag = false; noGuest.innerText = ''; sendtextbox.value = '';};
									const userProfile: ClientProfil = {
										command: '@noguest',
    									destination: '',
    									type:  'chat',
    									user:  '',
    									loginName:  '',
    									userID:  userId,
    									text:  '',
    									timestamp:  Date.now(),
    									SenderWindowID:  '',
    									SenderName:  userAskingToBlock,
    									SenderID:  '',
    									Sendertext:  '',
    									innerHtml:  '',
										guestmsg: noGuestFlag,
									}	
									socket.emit('guestmsg', JSON.stringify(userProfile));
									break;

							case '@profile':
								if (msgCommand[1] === '') {break;};
								getProfil(socket, msgCommand[1]);
								break;
    						case '@cls':
    						    chatWindow.innerHTML = '';
    						    break;
							case '@help':
								addMessage('*');
								addMessage('** ********** List of @cmds ********** **');
								addMessage('\'@cls\' - clear chat screen conversations');
								addMessage('\'@profile <name>\' - pulls ups user profile');
								addMessage('\'@block <name>\' - blocks / unblock user');
								addMessage('\'@notify\' - toggles notifications on / off');
								addMessage('\'@quit\' - disconnect user from the chat');
								addMessage('** *********************************** **');
								addMessage('*');
								break;
							case '@quit':
								quitChat(socket);
    						    break;
    						default:
								const user = getUser()?.name;
								const userID = getUser()?.id;
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
									SenderID: userID,

								};
								socket.emit('privMessage', JSON.stringify(message));
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
			sendtextbox.addEventListener('keydown', (event) => {
				if(!sendtextbox) return;
				if (event.key === 'Enter') {
					event.preventDefault();
					sendButton?.click();
				}
			});
		}
	}
};
addRoute('/chat', handleChat);
