import { addRoute, setTitle, type RouteHandlerParams, type RouteHandlerReturn } from "@app/routing";
import { showError } from "@app/toast";
import authHtml from './chat.html?raw';
import client from '@app/api'
import { getUser, updateUser } from "@app/auth";
import io, { Socket } from 'socket.io-client';

const color = {
	red: 'color: red; font-weight: bold;',
	green: 'color: green; font-weight: bold;',
	yellow: 'color: orange; font-weight: bold;',
	blue: 'color: blue; font-weight: bold;',
	reset: '', 
};


// get the name of the machine used to connect 
const machineHostName = window.location.hostname;
console.log('connect to login at %chttps://' + machineHostName + ':8888/app/login',color.yellow);

let __socket: Socket | undefined = undefined;
document.addEventListener('ft:pageChange', () => {
	if (__socket !== undefined)
		__socket.close();
	__socket = undefined;
	console.log("Page changed");
})

function getSocket(): Socket {
	// let addressHost = `wss://${machineHostName}:8888`;
	let addressHost = `wss://localhost:8888`;
	if (__socket === undefined)

		__socket = io(addressHost, {
			path: "/api/chat/socket.io/",
			secure: false,
			transports: ["websocket"],
		});
	return __socket;
}


async function isLoggedIn() {
	return getUser() || null;
} 

async function windowStateHidden() {		
	const socketId = __socket || undefined;
	let oldName = localStorage.getItem("oldName") || undefined;
	if (socketId == undefined) return;
	let userName = await updateUser();
	oldName =  userName?.name || undefined;
	if (oldName === undefined) return;
	localStorage.setItem('oldName', oldName);
	socketId.emit('client_left', {
		user: userName?.name,
		why: 'tab window hidden - socket not dead',
	});
	return;
}
	
	
async function windowStateVisable() {		
	const socketId = __socket || undefined;
	let oldName = localStorage.getItem("oldName") || undefined;
	console.log("%coldName :'" + oldName + "'", color.green);
	
	if (socketId === undefined || oldName === undefined) {console.log("%SOCKET ID", color.red); return;}
	const res = await client.guestLogin();
	let user = await updateUser();
	console.log("%cUserName :'" + user?.name + "'", color.green);
	socketId.emit('client_entered', {
		userName: oldName,
		user: user?.name,
	});
	setTitle('Chat Page');
	return;
}


async function listBuddies(buddies: HTMLDivElement, listBuddies: string ) {

	if (!buddies) return;
	const messageElement = document.createElement("div-buddies-list");
	messageElement.textContent = listBuddies + '\n';
	buddies.appendChild(messageElement);
	buddies.scrollTop = buddies.scrollHeight;
	console.log(`Added buddies: ${listBuddies}`)
	return ;

}

function waitSocketConnected(socket: Socket): Promise<void> {
    return new Promise(resolve => {
        if (socket.connected) return resolve(); // already connected
        socket.on("connect", () => resolve());
    });
}
const bconnected = document.getElementById('b-help') as HTMLButtonElement;
if (bconnected) {
	bconnected.click();
}



function handleChat(_url: string, _args: RouteHandlerParams): RouteHandlerReturn {
	

	let socket = getSocket();
	
	// Listen for the 'connect' event
	socket.on("connect", async () => {
		
		await waitSocketConnected(socket);
		console.log("I AM Connected to the server:", socket.id);
		const user = getUser()?.name;
		// Ensure we have a user AND socket is connected
		if (!user || !socket.connected) return;
		const message = {
			type: "chat",
			user,
			token: document.cookie ?? "",
			text: " has Just ARRIVED in the chat",
			timestamp: Date.now(),
			SenderWindowID: socket.id,
		};
		socket.emit('message', JSON.stringify(message));
	});

	// Listen for messages from the server "MsgObjectServer"
	socket.on("MsgObjectServer", (data: any) => {
		console.log("Message Obj Recieved:", data.message);
		console.log("Recieved data.message.text: ", data.message.text);
		console.log("Recieved data.message.user: ", data.message.user);
		console.log("Recieved data.message.type: ", data.message.type);
		console.log("Recieved data.message.token: ", data.message.token);
		console.log("Recieved data.message.timestamp: ", data.message.timestamp);
		// Display the message in the chat window
		const chatWindow = document.getElementById("t-chatbox") as HTMLDivElement;
		const bconnected = document.getElementById('b-help') as HTMLButtonElement;
		if (bconnected) {
			bconnected.click();
		}
		
		if (chatWindow) {
			const messageElement = document.createElement("div");
			messageElement.textContent = `${data.message.user}: ${data.message.text}`;
			chatWindow.appendChild(messageElement);
			chatWindow.scrollTop = chatWindow.scrollHeight;
		}
		console.log("Getuser():", getUser());
	});

	type Providers = {
		name: string,
		display_name: string,
		icon_url?: string,
		color?: { default: string, hover: string },
	};


		let toggle = false
		window.addEventListener("focus", () => {
			if (window.location.pathname === "/app/chat" && !toggle) {
			//   bconnected.click();
			  console.log("%cWindow is focused on /chat:" + socket.id, color.green);
			if (socket.id)
				windowStateVisable();
			  toggle = true;
			}
		});

		window.addEventListener("blur", () => {
			bconnected.click();
			console.log("%cWindow is not focused on /chat", color.red);
			if (socket.id)
				windowStateHidden();
		  	toggle = false;
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

			chatWindow.textContent = '';
			chatWindow.innerHTML = '';
			buddies.textContent = '';
			buddies.innerHTML = '';


			const addMessage = (text: string) => {
				if (!chatWindow) return;
				const messageElement = document.createElement("div-test");
				messageElement.textContent = text;
				chatWindow.appendChild(messageElement);
				chatWindow.scrollTop = chatWindow.scrollHeight;
				console.log(`Added new message: ${text}`)
				return ;
			};

			socket.once('welcome', (data) => {
				chatWindow.textContent = '';
				chatWindow.innerHTML = '';
				buddies.textContent = '';
				buddies.innerHTML = '';
				bconnected.click();
				addMessage (`${data.msg}  ` + getUser()?.name);
		});

			// Send button
			sendButton?.addEventListener("click", () => {
				if (sendtextbox && sendtextbox.value.trim()) {
					const msgText = sendtextbox.value.trim();
					bconnected.click();
					addMessage(msgText);
					const user = getUser();
					if (user && socket?.connected) {
						const message = {
							type: "chat",
							user: user.name,
							token: document.cookie,
							text: msgText,
							timestamp: Date.now(),
							SenderWindowID: socket.id,
						};
						socket.emit('message', JSON.stringify(message));
					}
					sendtextbox.value = "";
				}
			});


			// Clear Text button
			clearText?.addEventListener("click", () => {
				if (chatWindow) {
					bconnected.click();
					chatWindow.innerHTML = '';
				}
			});

					
			bconnected.click();
			setInterval(async () => {
			    bconnected.click();
			}, 50000); // every 1 second

			// Help Text button
			bconnected?.addEventListener("click", async () => {

				const loggedIn = await isLoggedIn();
				let oldUser = localStorage.getItem("oldName") || undefined;
				if (loggedIn?.name === undefined) return ;
				oldUser =  loggedIn.name || "undefined";
				const res = await client.guestLogin();
				let user = await updateUser();
				localStorage.setItem("oldName", oldUser);
				buddies.textContent = "";
				if (chatWindow) {
					// addMessage('@list - lists all connected users in the chat');
					socket.emit('list', {
						oldUser: oldUser,
						user: user?.name,
					});
				}
			
			});
			socket.on('listObj', (list: string) => {
				console.log('List chat clients connected ', list);
				addMessage(list);
			});

			socket.on('listBud', (myBuddies: string) => {
				console.log('List buddies connected ', myBuddies);
				listBuddies(buddies,myBuddies);
			});


			// Enter key to send message
			sendtextbox!.addEventListener('keydown', (event) => {
				if (event.key === 'Enter') {
					sendButton?.click();
				}
			});

			// Whoami button to display user name
			bwhoami?.addEventListener('click', async () => {
				try {
					const loggedIn = await isLoggedIn();
					let oldUser = localStorage.getItem("oldName") || undefined;
					oldUser =  loggedIn?.name || "undefined";
					localStorage.setItem("oldName", oldUser);
					
					const res = await client.guestLogin();
					switch (res.kind) {
						case 'success': {
							let user = await updateUser();
							console.log('USER ', user?.name);
							if (chatWindow) {
								socket.emit('updateClientName', {
									oldUser: oldUser,
									user: user?.name
								});
							}
							if (user === null)
								return showError('Failed to get user: no user ?');
							setTitle(`Welcome ${user.guest ? '[GUEST] ' : ''}${user.name}`);
							break;
						}
						case 'failed': {
							showError(`Failed to login: ${res.msg}`);
						}
					}
				} catch (e) {
					console.error("Login error:", e);
					showError('Failed to login: Unknown error');
				}
			});
		}
	}
};
addRoute('/chat', handleChat, { bypass_auth: true });

