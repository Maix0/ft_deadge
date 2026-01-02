import { addRoute, setTitle, type RouteHandlerParams, type RouteHandlerReturn } from "@app/routing";
import authHtml from './pong.html?raw';
import io from 'socket.io-client';
import type { CSocket, GameMove, GameUpdate } from "./socket";
import { showError, showInfo } from "@app/toast";

// TODO: local game (2player -> server -> 2player : current setup)
// TODO: tournament via remote (dedicated queu? idk)
//

// get the name of the machine used to connect
declare module 'ft_state' {
	interface State {
		pongSock?: CSocket;
	}
}

document.addEventListener("ft:pageChange", () => {
	if (window.__state.pongSock !== undefined) window.__state.pongSock.close();
	window.__state.pongSock = undefined;
});

export function getSocket(): CSocket {
	if (window.__state.pongSock === undefined)
		window.__state.pongSock = io(window.location.host, { path: "/api/pong/socket.io/" }) as any as CSocket;
	return window.__state.pongSock;
}

function pongClient(_url: string, _args: RouteHandlerParams): RouteHandlerReturn {
	setTitle('Pong Game Page');
	return {

		html: authHtml, postInsert: async (app) => {
			const checkbox = document.getElementById("modeToggle") as HTMLInputElement;
			const label = document.getElementById("toggleLabel") as HTMLSpanElement;
			const track = document.getElementById("toggleTrack") as HTMLDivElement;
			const knob = document.getElementById("toggleKnob") as HTMLSpanElement;

			checkbox.addEventListener("change", () => { // web vs local
				if (checkbox.checked) {
					label.textContent = "Web";
					track.classList.replace("bg-gray-300", "bg-blue-600");
					knob.classList.add("translate-x-7");
				} else {
					label.textContent = "Local";
					track.classList.replace("bg-blue-600", "bg-gray-300");
					knob.classList.remove("translate-x-7");
				}
			});



			const batLeft = document.querySelector<HTMLDivElement>("#batleft");
			const batRight = document.querySelector<HTMLDivElement>("#batright");
			const ball = document.querySelector<HTMLDivElement>("#ball");
			const score = document.querySelector<HTMLDivElement>("#score-board");
			if (!batLeft || !batRight || !ball || !score)
				return showError('fatal error');

			let socket = getSocket();

			// keys handler
			const keys: Record<string, boolean> = {};

			document.addEventListener("keydown", (e) => {
				keys[e.key.toLowerCase()] = true;
			});
			document.addEventListener("keyup", (e) => {
				keys[e.key.toLowerCase()] = false;
			});

			setInterval(() => { // key sender
				let packet: GameMove = {
					move: null,
				}
				if ((keys['w'] !== keys['s'])) {
					packet.move = keys['w'] ? 'up' : 'down';
				}

				socket.emit('gameMove', packet);
			}, 1000 / 60);

			const render = (state: GameUpdate) => {
				//batLeft.style.transform = `translateY(${state.left.paddle.y}px) translateX(${state.left.paddle.x}px)`;
				batLeft.style.top = `${state.left.paddle.y}px`;
				batLeft.style.left = `${state.left.paddle.x}px`;
				batLeft.style.width = `${state.left.paddle.width}px`;
				batLeft.style.height = `${state.left.paddle.height}px`;

				//batRight.style.transform = `translateY(${state.right.paddle.y}px) translateX(-${state.left.paddle.x}px)`;
				batRight.style.top = `${state.right.paddle.y}px`;
				batRight.style.left = `${state.right.paddle.x}px`;
				batRight.style.width = `${state.right.paddle.width}px`;
				batRight.style.height = `${state.right.paddle.height}px`;

				ball.style.transform = `translateX(${state.ball.x - state.ball.size}px) translateY(${state.ball.y - state.ball.size}px)`;
				ball.style.height = `${state.ball.size * 2}px`;
				ball.style.width = `${state.ball.size * 2}px`;


				score.innerText = `${state.left.score} | ${state.right.score}`
			}

			socket.on('gameUpdate', (state: GameUpdate) => render(state));
			socket.on('newGame', (state) => render(state));

			socket.on('updateInformation', (e) => showInfo(`UpdateInformation: t=${e.totalUser};q=${e.inQueue}`));
			socket.on('queueEvent', (e) => showInfo(`QueueEvent: ${e}`));
			socket.emit('enqueue');
		}
	}
};
addRoute('/pong', pongClient);
