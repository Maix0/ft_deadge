import { addRoute, setTitle, type RouteHandlerParams, type RouteHandlerReturn } from "@app/routing";
import { showError } from "@app/toast";
import authHtml from './pong.html?raw';
import client from '@app/api'
import { getUser, updateUser } from "@app/auth";
import io, { Socket } from 'socket.io-client';
import { addPongMessage } from './addPongMessage';
import { isLoggedIn } from './isLoggedIn';
import type { ClientMessage, ClientProfil } from './types_front';
 
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
			path: "/api/pong/socket.io/",
			secure: false,
			transports: ["websocket"],
		});
	return __socket;
};


function waitSocketConnected(socket: Socket): Promise<void> {
    return new Promise(resolve => {
        if (socket.connected) return resolve();
        socket.on("connect", () => resolve());
    });
};


async function whoami(socket: Socket) {
	try {
		const chatWindow = document.getElementById("t-chatbox") as HTMLDivElement;
		const loggedIn = isLoggedIn();

		const res = await client.guestLogin();
		switch (res.kind) {
			case 'success': {
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
};


function handleChat(_url: string, _args: RouteHandlerParams): RouteHandlerReturn {
	
	let socket = getSocket();

	/**
	 * on connection plays this part
	 */

	socket.on("connect", async () => {
		const systemWindow = document.getElementById('system-box') as HTMLDivElement;
		await waitSocketConnected(socket);
		console.log("I AM Connected to the server:", socket.id);
		const message = {
			command: "",
			destination: 'system-info',
			type: "chat",
			user: getUser()?.name,
			token: document.cookie ?? "",
			text: " has Just ARRIVED in the chat",
			timestamp: Date.now(),
			SenderWindowID: socket.id,
		};
		socket.emit('message', JSON.stringify(message));
		const messageElement = document.createElement("div");
    	messageElement.textContent = `${message.user}: is connected au server`;
    	systemWindow.appendChild(messageElement);
		systemWindow.scrollTop = systemWindow.scrollHeight;
	});

	/**
	 * sockets different listeners
	 * transport different data formats
	 */

	socket.on("MsgObjectServer", (data: { message: ClientMessage}) => {
		console.log('%csocket.on MsgObjectServer', color.yellow );
		addPongMessage(`</br>${data.message.text}`);
	});

	socket.on('profilMessage', (profil: ClientProfil) => {	
		console.log('%csocket.on profilMessage', color.yellow );
	});

	socket.on('inviteGame', (invite: ClientProfil) => {	
		console.log('%csocket.on inviteGame', color.yellow );
	});

	socket.on('blockUser', (blocked: ClientProfil) => {	
		console.log('%csocket.on blockUser', color.yellow );
	});

	socket.on('logout', () => {	
		console.log('%csocket.on logout', color.yellow );
	});

	socket.on('privMessageCopy', (message) => {
		console.log('%csocket.on privMessageCopy', color.yellow );
	})

	socket.on('nextGame', (message: string) => {
		console.log('%csocket.on nextGame', color.yellow );
	})

	socket.on('listBud', async (myBuddies: string)  => {
		console.log('%csocket.on listBud', color.yellow );
		addPongMessage('socket.once \'listBud\' called')

	});

	socket.once('welcome', (data) => {
		console.log('%cWelcome PONG PAGE', color.yellow );
		addPongMessage('socket.once \'Welcome\' called')
	});


	setTitle('Pong Page');
	return {

		html: authHtml, postInsert: async (app) => {
			const bwhoami = document.getElementById('b-whoami') as HTMLButtonElement;
		
			bwhoami?.addEventListener('click', async () => {
				whoami(socket);
			});
		}
	}
};
addRoute('/pong', handleChat, { bypass_auth: true });