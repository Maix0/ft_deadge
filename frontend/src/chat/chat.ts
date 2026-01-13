import "./chat.css";
import io, { Socket } from "socket.io-client";
import type { blockedUnBlocked } from "./types_front";
import type {
	ClientMessage,
	ClientProfil,
	ClientProfilPartial,
} from "./types_front";
import type { User } from "@app/auth";
import {
	addRoute,
	navigateTo,
	setTitle,
	type RouteHandlerParams,
	type RouteHandlerReturn,
} from "@app/routing";
import authHtml from "./chat.html?raw";
import { getUser } from "@app/auth";
import { listBuddies } from "./chatHelperFunctions/listBuddies";
import { getProfil } from "./chatHelperFunctions/getProfil";
import { addInviteMessage, addMessage } from "./chatHelperFunctions/addMessage";
import { broadcastMsg } from "./chatHelperFunctions/broadcastMsg";
import { openProfilePopup } from "./chatHelperFunctions/openProfilePopup";
import { actionBtnPopUpBlock } from "./chatHelperFunctions/actionBtnPopUpBlock";
import { actionBtnPongGames } from "./chatHelperFunctions/actionBtnPongGames";
import { windowStateHidden } from "./chatHelperFunctions/windowStateHidden";
import { blockUser } from "./chatHelperFunctions/blockUser";
import { parseCmdMsg } from "./chatHelperFunctions/parseCmdMsg";
import { actionBtnPopUpInvite } from "./chatHelperFunctions/actionBtnPopUpInvite";
import { waitSocketConnected } from "./chatHelperFunctions/waitSocketConnected";
import { connected } from "./chatHelperFunctions/connected";
import { quitChat } from "./chatHelperFunctions/quitChat";
import { openMessagePopup } from "./chatHelperFunctions/openMessagePopup";
import { windowStateVisable } from "./chatHelperFunctions/windowStateVisable";
import { cmdList } from "./chatHelperFunctions/cmdList";
import { showInfo } from "../toast";
import { actionBtnTTTGames } from "./chatHelperFunctions/actionBtnTTTGames";

const MAX_SYSTEM_MESSAGES = 10;
let inviteMsgFlag: boolean = false;
export let noGuestFlag: boolean = true;

declare module "ft_state" {
	interface State {
		chatSock?: Socket;
	}
}

class DivPrivate extends HTMLElement {
	constructor() {
		super();
	}
}

customElements.define("div-private", DivPrivate);

export function getSocket(): Socket {
	if (window.__state.chatSock === undefined)
		window.__state.chatSock = io(window.location.host, {
			path: "/api/chat/socket.io/",
		}) as any as Socket;
	return window.__state.chatSock;
}

const chatBox = document.getElementById("chatBox")!;
chatBox.classList.add("hidden");
chatBox.innerHTML = authHtml;

const bquit = document.getElementById("b-quit") as HTMLDivElement;
const buddies = document.getElementById("div-buddies") as HTMLDivElement;
const buttonMessage = document.getElementById("close-modal-message") ?? null;
const buttonPro = document.getElementById("close-modal") ?? null;
const chatButton = document.querySelector("#chatButton");
const chatWindow = document.querySelector("#t-chatbox")!;
const clearText = document.getElementById("b-clear") as HTMLButtonElement;
const gameMessage = document.getElementById("game-modal") ?? null;
const myGames = document.getElementById("b-hGame") ?? null;
const myTTTGames = document.getElementById("b-hTGame") ?? null;
const modalmessage = document.getElementById("modal-message") ?? null;
const noGuest = document.getElementById("noGuest") ?? null;
const notify = document.getElementById("notify") ?? null;
const overlay = document.querySelector("#overlay")!;
const profilList = document.getElementById("profile-modal") ?? null;
const sendButton = document.getElementById("b-send") as HTMLButtonElement;
const sendtextbox = document.getElementById(
	"t-chat-window",
) as HTMLButtonElement;
const systemWindow = document.getElementById("chat-system-box") as HTMLDivElement;

function initChatSocket() {
	let socket = getSocket();
	let blockMessage: boolean;
	// Listen for the 'connect' event
	socket.on("connect", async () => {
		await waitSocketConnected(socket);
		const user = getUser()?.name;
		const userID = getUser()?.id;
		// Ensure we have a user AND socket is connected
		if (!user || !socket.connected || !noGuest) return;
		const message = {
			command: "",
			destination: "system-info",
			type: "chat",
			user,
			token: document.cookie ?? "",
			text: " has Just ARRIVED in the chat",
			timestamp: Date.now(),
			SenderWindowID: socket.id,
			SenderID: userID,
		};
		socket.emit("message", JSON.stringify(message));
		const guest = getUser()?.guest;
		if (guest) {
			noGuest.innerText = "";
		} else {
			noGuest.innerText = "❤️";
		}

		const userProfile: ClientProfil = {
			command: "@noguest",
			destination: "",
			type: "chat",
			timestamp: Date.now(),
			guestmsg: true,
		};
		socket.emit("guestmsg", JSON.stringify(userProfile));
		const messageElement = document.createElement("div");
		messageElement.textContent = `${user}: is connected au server`;
		systemWindow.appendChild(messageElement);
		systemWindow.scrollTop = systemWindow.scrollHeight;
	});

	// Listen for messages from the server "MsgObjectServer"
	socket.on("MsgObjectServer", (data: { message: ClientMessage }) => {
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
			const chatWindow = document.getElementById(
				"t-chatbox",
			) as HTMLDivElement;
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

	socket.on("profilMessage", (profil: ClientProfil) => {
		profil.SenderID = getUser()?.id ?? "";
		profil.SenderName = getUser()?.name ?? "";
		openProfilePopup(profil);
		socket.emit("isBlockdBtn", profil);
		socket.emit("check_Block_button", profil);
		actionBtnPopUpInvite(profil, socket);
		actionBtnPopUpBlock(profil, socket);
		actionBtnPongGames(profil, socket);
		actionBtnTTTGames(profil, socket);
	});

	socket.on("blockUser", (blocked: ClientProfil) => {
		let icon = "⛔";
		if (inviteMsgFlag) {
			const messageElement = document.createElement("div");
			if (`${blocked.text}` === "I have un-blocked you") {
				icon = "💚";
			}
			messageElement.innerText = `${icon}${blocked.SenderName}:  ${blocked.text}`;
			chatWindow.appendChild(messageElement);
			chatWindow.scrollTop = chatWindow.scrollHeight;
		}
	});

	socket.on("blockBtn", (data: blockedUnBlocked) => {
		const blockUserBtn = document.querySelector("#popup-b-block");
		if (blockUserBtn) {
			let message = "";
			if (data.userState === "block") {
				((message = "un-block"), (blockMessage = true));
			} else {
				((message = "block"), (blockMessage = false));
			}
			blockUserBtn.textContent = message;
		}
	});

	socket.on("logout", () => {
		quitChat();
	});

	socket.on("privMessageCopy", (message: string) => {
		const htmlBaliseRegex = /<a\b[^>]*>[\s\S]*?<\/a>/;
		const htmlBaliseMatch = message.match(htmlBaliseRegex);

		if (htmlBaliseMatch)
			addInviteMessage(message);
		else 
			addMessage(message);
	});

	//receives broadcast of the next GAME
	socket.on("nextGame", (message: string) => {
		openMessagePopup(message);
	});

	socket.on("listBud", async (myBuddies: string[]) => {
		const buddies = document.getElementById(
			"div-buddies",
		) as HTMLDivElement;
		listBuddies(socket, buddies, myBuddies);
	});

	socket.once("welcome", (data) => {
		const buddies = document.getElementById(
			"div-buddies",
		) as HTMLDivElement;
		buddies.textContent = "";
		buddies.innerHTML = "";
		connected(socket);
		addMessage(`${data.msg}  ` + getUser()?.name);
	});
	buddies.textContent = "";
	buddies.innerHTML = "";
}

if (buttonPro)
	buttonPro.addEventListener("click", () => {
		if (profilList) profilList.classList.add("hidden");
	});

if (buttonMessage)
	buttonMessage.addEventListener("click", () => {
		if (gameMessage) gameMessage.classList.add("hidden");
		if (modalmessage) {
			modalmessage.innerHTML = "";
		}
	});

// Send button
sendButton?.addEventListener("click", () => {
	let socket = window.__state.chatSock;
	if (!socket) return;
	const userId = getUser()?.id;
	const userAskingToBlock = getUser()?.name;
	if (sendtextbox && sendtextbox.value.trim()) {
		let msgText: string = sendtextbox.value.trim();
		const msgCommand = parseCmdMsg(msgText) ?? "";
		connected(socket);
		if (msgCommand !== "") {
			switch (msgCommand[0]) {
				case "@msg":
					broadcastMsg(socket, msgCommand);
					break;

				case "@block":
					if (msgCommand[1] === "") {
						break;
					}
					if (!userAskingToBlock) return;
					if (!userId) return;
					const userToBlock: ClientProfil = {
						command: msgCommand[0],
						destination: "",
						type: "chat",
						user: msgCommand[1],
						userID: userId,
						timestamp: Date.now(),
						SenderWindowID: socket.id,
						SenderName: userAskingToBlock,
					};
					blockUser(userToBlock, socket);
					break;

				case "@notify":
					if (notify === null) {
						break;
					}
					if (inviteMsgFlag === false) {
						notify.innerText = "🔔";
						inviteMsgFlag = true;
					} else {
						notify.innerText = "🔕";
						inviteMsgFlag = false;
					}
					break;

				case "@pong": 
					if (msgCommand[1] === "") {
						navigateTo("/app/pong/games");
						quitChat();
					} 
					break;

				case "@ttt": 
					if (msgCommand[1] === "") {
						navigateTo("/app/ttt/games");
						quitChat();
					} 
					break;
			
				case "@guest":
					if (!userId) {
						return;
					}
					if (!userAskingToBlock) {
						return;
					}
					if (noGuest === null) {
						break;
					}
					const guest = getUser()?.guest;
					if (noGuestFlag === false && noGuest.innerText === "💔") {
						noGuest.innerText = "❤️​";
						noGuestFlag = true;
					} else {
						noGuest.innerText = "💔";
						noGuestFlag = false;
					}
					if (guest) {
						noGuestFlag = true;
						noGuest.innerText = "";
						sendtextbox.value = "";
					}
					const userProfile: ClientProfilPartial = {
						command: "@noguest",
						destination: "",
						type: "chat",
						user: userAskingToBlock,
						userID: userId,
						timestamp: Date.now(),
						SenderWindowID: "",
						guestmsg: noGuestFlag,
					};
					socket.emit("guestmsg", JSON.stringify(userProfile));
					break;

				case "@profile":
					if (msgCommand[1] === "") {
						break;
					}
					getProfil(socket, msgCommand[1]);
					break;
				case "@cls":
					chatWindow.innerHTML = "";
					break;
				case "@help":
					cmdList();
					break;

				case "@quit":
					quitChat();
					break;

				default:
					const user: User | null = getUser();
					if (!user) return;
					if (!user || !socket.connected) return;
					const message: ClientProfilPartial = {
						command: msgCommand[0],
						destination: "",
						type: "chat",
						user: user.name,
						userID: user.id,
						token: document.cookie ?? "",
						text: msgCommand[1],
						timestamp: Date.now(),
						SenderWindowID: socket.id ?? "",
						SenderID: user.id,
					};
					socket.emit("privMessage", JSON.stringify(message));
					break;
			}
			// Clear the input in all cases
			sendtextbox.value = "";
		}
	}
});

let toggle = false;
window.addEventListener("focus", async () => {
	setTimeout(() => {
		if (window.__state.chatSock) connected(window.__state.chatSock);
	}, 16);
	// if (window.location.pathname === "/app/chat") {
		// if (window.__state.chatSock?.id) {
			await windowStateVisable();
		// }
		toggle = true;
	// }
});

window.addEventListener("blur", () => {
	if (window.__state.chatSock?.id) windowStateHidden();
	toggle = false;
});
// Clear Text button
clearText?.addEventListener("click", () => {
	if (chatWindow) {
		chatWindow.innerHTML = "";
	}
});

bquit?.addEventListener("click", () => {
	quitChat();
	
});

myGames?.addEventListener("click", () => {
	navigateTo("/app/pong/games");
	quitChat();
});

myTTTGames?.addEventListener("click", () => {
	navigateTo("/app/ttt/games");
	quitChat();
});



// Enter key to send message
sendtextbox.addEventListener("keydown", (event) => {
	if (!sendtextbox) return;
	if (event.key === "Enter") {
		event.preventDefault();
		sendButton?.click();
	}
});

chatButton!.addEventListener("click",() => {
	if (chatBox.classList.contains("hidden")) {
		chatBox.classList.toggle("hidden");
		overlay.classList.add("opacity-60");
		windowStateVisable();
		let socket = window.__state.chatSock;
		if (!socket) return;
		connected(socket);		
		
	} else {
		chatBox.classList.toggle("hidden");
		overlay.classList.remove("opacity-60");
		windowStateHidden();
	}
});

document.addEventListener("ft:userChange", (user) => {
	let newUser: { id: string; name: string } | null = user.detail;
	window.__state.chatSock?.disconnect();
	window.__state.chatSock = undefined;
	if (newUser === null) {
		quitChat();
		// logged out
		// hide chat button
	} else {
		// user has changed
		initChatSocket();
	}
});
