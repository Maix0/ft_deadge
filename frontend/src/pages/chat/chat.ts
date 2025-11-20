import { addRoute, setTitle, type RouteHandlerParams, type RouteHandlerReturn } from "@app/routing";
import { showError } from "@app/toast";
import authHtml from './chat.html?raw';
import client from '@app/api'
import { getUser, updateUser } from "@app/auth";
import io from "socket.io-client";

const socket = io("wss://localhost:8888", {
	path: "/api/chat/socket.io/",
	secure: false,
	transports: ["websocket"],
});

// Listen for the 'connect' event
socket.on("connect", async () => {
	console.log("I AM Connected to the server: ", socket.id);
	// Emit a custom event 'coucou' with some data
	//socket.emit("coucou", { message: " Nigel from coucou!" });
	//socket.emit('testend', socket.id);
	// Send a message to the server
	//socket.send(" from the client: " + `${socket.id}`);
});

// Listen for messages from the server "MsgObjectServer"
socket.on("MsgObjectServer", (data) => {
  	console.log("Message Obj Recieved:", data.message);
  	console.log("Recieved data.message.text: ", data.message.text);
  	console.log("Recieved data.message.user: ", data.message.user);
  	console.log("Recieved data.message.type: ", data.message.type);
  	console.log("Recieved data.message.token: ", data.message.token);
  	console.log("Recieved data.message.timestamp: ", data.message.timestamp);

	// Display the message in the chat window
	const chatWindow = document.getElementById("t-chatbox") as HTMLDivElement;
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

function handleChat(_url: string, _args: RouteHandlerParams): RouteHandlerReturn {

	setTitle('Chat Page');
	// Listen for the 'connect' event
	return {

		html: authHtml, postInsert: async (app) => {
		const sendButton = document.getElementById('b-send') as HTMLButtonElement;
		const chatWindow = document.getElementById('t-chatbox') as HTMLDivElement;
		const sendtextbox = document.getElementById('t-chat-window') as HTMLButtonElement;
		const clearText = document.getElementById('b-logout') as HTMLButtonElement;
		const bwhoami = document.getElementById('b-whoami') as HTMLButtonElement;
		const username = document.getElementById('username') as HTMLDivElement;

	  	const addMessage = (text: string) => {
			if (!chatWindow) return;
	   	 	const messageElement = document.createElement("div");
			messageElement.textContent = text;
			chatWindow.appendChild(messageElement);
			chatWindow.scrollTop = chatWindow.scrollHeight;
	  	};

		// Send button
	  	sendButton?.addEventListener("click", () => {
	  	  if (sendtextbox && sendtextbox.value.trim()) {
	  		const msgText = sendtextbox.value.trim();
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
	  		  socket.send(JSON.stringify(message));
	  		}
	  		sendtextbox.value = "";
	  	  }
	  	});


		// Clear Text button
		clearText?.addEventListener("click", () => {
			if (chatWindow) {
				chatWindow.innerHTML = '';
			}
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
				const res = await client.guestLogin();
				switch (res.kind) {
					case 'success': {
						let user = await updateUser();
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