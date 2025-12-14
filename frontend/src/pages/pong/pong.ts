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

	
	const keys: Record<string, boolean> = {};
	
	document.addEventListener("keydown", (e) => {
		keys[e.key.toLowerCase()] = true;
	});
	
	document.addEventListener("keyup", (e) => {
		keys[e.key.toLowerCase()] = false;
	});
	
	setInterval(() => {
		if (keys['w']) { 
			socket.emit("batmove_Left", "up");
			console.log('north key pressed - emit batmove_Left up');
		}
		if (keys['s']) { 
			socket.emit("batmove_Left", "down");
			console.log('south key pressed - emit batmove_Left down');
		}
		if (keys['p']) { 
			socket.emit("batmove_Right", "up");
			console.log('north key pressed - emit batmove_Right up');
		}
		if (keys['l']) { 
			socket.emit("batmove_Right", "down");
			console.log('south key pressed - emit batmove_Right down');
		}		
	}, 16);
	

    
    // Listen for Left bat updates
    socket.on("batLeft_update", (y: number) => {
        console.log('batLeft_update received y: ', y);
		const bat = document.getElementById("batleft") as HTMLDivElement | null;
    	if (!bat) {
        	console.error("FATAL ERROR: Bat element with ID 'bat-left' not found. Check HTML.");
			return ; 
    	}        
        if (typeof y === 'number' && !isNaN(y)) {
            bat.style.transform = `translateY(${y}px)`;
        } else {
             console.warn(`Received invalid Y value: ${y}`);
        }
    });

    // Listen for Right bat updates
    socket.on("batRight_update", (y: number) => {
        console.log('batRight_update received y: ', y);
		const bat = document.getElementById("batright") as HTMLDivElement | null;
    	if (!bat) {
        	console.error("FATAL ERROR: Bat element with ID 'bat-Right' not found. Check HTML.");
			return ; 
    	}        
        if (typeof y === 'number' && !isNaN(y)) {
            bat.style.transform = `translateY(${y}px)`;
        } else {
             console.warn(`Received invalid Y value: ${y}`);
        }
    });




	
	socket.once('welcome', (data) => {
		console.log('%cWelcome PONG PAGE', color.yellow );
		addPongMessage('socket.once \'Welcome\' called')
	});



			// Listen for messages from the server "MsgObjectServer"
	socket.on("MsgObjectServer", (data: { message: ClientMessage}) => {
		// Display the message in the chat window
		const systemWindow = document.getElementById('system-box') as HTMLDivElement;
		
		
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