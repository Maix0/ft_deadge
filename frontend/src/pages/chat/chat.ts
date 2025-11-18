import { addRoute, setTitle, type RouteHandlerParams, type RouteHandlerReturn } from "@app/routing";
import { showError } from "@app/toast";
import authHtml from './chat.html?raw';
import client from '@app/api'
import { updateUser } from "@app/auth";
import  io  from "socket.io-client"


// const socket = io("wss://localhost:8888");

const socket = io("wss://localhost:8888", {
  path: "/app/chat/socket.io/",
  secure: false,
  transports: ["websocket"],
});

// Listen for the 'connect' event
socket.on("connect", () => {
	console.log("Connected to the server: ", socket.id);
	// Send a message to the server
	socket.send("Hello from the client: " + `${socket.id}`);
	// Emit a custom event 'coucou' with some data
	socket.emit("coucou", { message: "Hello Nigel from coucou!" });
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
			const sendtextbox= document.getElementById('t-chat-window') as HTMLButtonElement;
			const blogout = document.getElementById('b-logout') as HTMLButtonElement;
			const bwhoami = document.getElementById('b-whoami') as HTMLButtonElement;
			const username = document.getElementById('username') as HTMLDivElement;
			

			const value = await client.chatTest();
			if (value.kind === "success")
			{
				console.log(value.payload);
			}
			else if (value.kind === "notLoggedIn")
			{

			} else {
				console.log('unknown response: ', value);
			}
			
			// Add a new message to the chat display
			const addMessage = (text: any) => {
				const messageElement = document.createElement('div');
				messageElement.textContent = JSON.stringify(text, null, 2);
				chatWindow.appendChild(messageElement);
				chatWindow.scrollTop = chatWindow.scrollHeight;   //puts scroll to the bottom
			};
			
			sendButton!.addEventListener('click', async () => {
  			let msgtext: string = sendtextbox.value;

  				if (msgtext) {
    				addMessage(msgtext);
					sendtextbox.value = "";
  				}
			});
			
			chatWindow.textContent = "helloWorld";

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