import { addRoute, navigateTo, setTitle, type RouteHandlerParams, type RouteHandlerReturn } from "@app/routing";
import authHtml from './pong.html?raw';
import io from 'socket.io-client';
import type { CSocket, GameMove, GameUpdate } from "./socket";
import { showError, showInfo } from "@app/toast";
import { getUser, type User } from "@app/auth";
import { isNullish } from "@app/utils";
import client from "@app/api";
import "./pong.css";

// get the name of the machine used to connect
declare module 'ft_state' {
	interface State {
		pongSock?: CSocket;
	}
}

	// GameRdyDown = "Ready Up?"
	// GameRdyUp = "Ready down?"
enum QueueState {
	InQueu = "In Queue",
	InGame = "In Game",
	Ready = "Ready-ing",
	Iddle = "Queue Up",
	In_local = "In Local",
};

enum ReadyState {
	readyUp = "ready up?",
	readyDown = "ready down",
};

document.addEventListener("ft:pageChange", (newUrl) => {
	if (newUrl.detail.startsWith('/app/pong') || newUrl.detail.startsWith('/pong')) return;
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
	// MAYBE: "queue up" btn : adds timer to page for duration of queue
	// TODO: "local play" btn : emit "local new game" evt to server; play game on single computer (maybe need to change keys-handling logic)
	
	return {
		html: authHtml, postInsert: async (app) => {
			const DEFAULT_COLOR = "white";
			const SELF_COLOR = "red";

			const user = getUser();
			let currentGame: GameUpdate | null = null;
			let opponent: User | null = null;
			const rdy_btn = document.querySelector<HTMLButtonElement>('#readyup-btn');
			const batLeft = document.querySelector<HTMLDivElement>("#batleft");
			const batRight = document.querySelector<HTMLDivElement>("#batright");
			const ball = document.querySelector<HTMLDivElement>("#ball");
			const score = document.querySelector<HTMLDivElement>("#score-board");
			const playerL = document.querySelector<HTMLDivElement>('#player-left');
			const playerR = document.querySelector<HTMLDivElement>('#player-right');
			const queueBtn = document.querySelector<HTMLButtonElement>("#QueueBtn");
			const LocalGameBtn = document.querySelector<HTMLButtonElement>("#LocalBtn");
			const gameBoard = document.querySelector<HTMLDivElement>("#pongbox");
			const queue_infos = document.querySelector<HTMLSpanElement>("#queue-info");

			let socket = getSocket();

			if (isNullish(user)) { // if no user (no loggin / other) : GTFO
				navigateTo("/app");
				return ;
			}
			if (!batLeft || !batRight || !ball || !score || !queueBtn || !playerL || !playerR || !gameBoard || !queue_infos || !LocalGameBtn || !rdy_btn) // sanity check
				return showError('fatal error');

			// ---
			// keys handler
			// ---
			const keys: Record<string, boolean> = {};

			document.addEventListener("keydown", (e) => {keys[e.key.toLowerCase()] = true;});
			document.addEventListener("keyup", (e) => {keys[e.key.toLowerCase()] = false;});

			setInterval(() => { // key sender
				if (queueBtn.innerText !== QueueState.InGame)//we're in game ? continue | gtfo 
					return ;
				if (currentGame === null) return;

				let packet: GameMove = {
					move: null,
					moveRight: null,
				}

				if (queueBtn.innerText !== QueueState.InGame)//we're in game ? continue | gtfo 
					return ;
				if (currentGame === null) return;

				if ((keys['w'] !== keys['s']))
					packet.move = keys['w'] ? 'up' : 'down';
				if (currentGame.local && (keys['o'] !== keys['l']))
					packet.moveRight = keys['o'] ? 'up' : 'down';
				socket.emit('gameMove', packet);
			}, 1000 / 60);
			// ---
			// keys end
			// ---

			// ---
			// position logic (client)
			// ---
			const DEFAULT_POSITIONS : GameUpdate = {
				gameId:"",
				ball:{size:16, x:800/2, y:450/2},
				left:{id:"", paddle:{x:40, y:185, width:12, height:80}, score:0},
				right:{id:"", paddle:{x:748, y:185, width:12, height:80}, score:0},
				local:false
			};

			function resetBoard(batLeft : HTMLDivElement, batRight : HTMLDivElement, playerL : HTMLDivElement, playerR : HTMLDivElement) {
				render(DEFAULT_POSITIONS);
				batLeft.style.backgroundColor = DEFAULT_COLOR;
				batRight.style.backgroundColor = DEFAULT_COLOR;
				playerR.style.color = "";
				playerL.style.color = "";
				playerR.innerText = "";
				playerL.innerText = "";
				currentGame = null;
				opponent = null;
			}

			const render = (state: GameUpdate) => {
				currentGame = state;
				batLeft.style.top = `${state.left.paddle.y}px`;
				batLeft.style.left = `${state.left.paddle.x}px`;
				batLeft.style.width = `${state.left.paddle.width}px`;
				batLeft.style.height = `${state.left.paddle.height}px`;

				batRight.style.top = `${state.right.paddle.y}px`;
				batRight.style.left = `${state.right.paddle.x}px`;
				batRight.style.width = `${state.right.paddle.width}px`;
				batRight.style.height = `${state.right.paddle.height}px`;

				ball.style.transform = `translateX(${state.ball.x - state.ball.size}px) translateY(${state.ball.y - state.ball.size}px)`;
				ball.style.height = `${state.ball.size * 2}px`;
				ball.style.width = `${state.ball.size * 2}px`;

				score.innerText = `${state.left.score} | ${state.right.score}`
			}
			socket.on('gameUpdate', (state: GameUpdate) => {
				// if (rdy_btn)
				// 	rdy_btn.classList.add('hidden');
				render(state);});
			// ---
			// position logic (client) end
			// ---

			// ---
			// queue evt 
			// ---
			// utils
			function set_pretty(batU : HTMLDivElement, txtU : HTMLDivElement, txtO : HTMLDivElement, colorYou : string) {
				batU.style.backgroundColor = colorYou;
				txtU.style.color = colorYou;
				txtU.innerText = isNullish(user) ? "you" : user.name;
				txtO.innerText = isNullish(opponent) ? "the mechant" : opponent.name;
			}
			async function get_opponent(opponent_id : string) {
				let t = await client.getUser({user:opponent_id});

				switch (t.kind) {
					case "success" :
						opponent = t.payload;
						break ;
					default :
						opponent = null;
				}
			}

			// btn setup
			queueBtn.addEventListener("click", ()=>{
				if (queueBtn.innerText !== QueueState.Iddle) {
					if (queueBtn.innerText === QueueState.InQueu) {
						socket.emit("dequeue");
						queueBtn.innerText = QueueState.Iddle;
					}
					return ;
				}
				queueBtn.innerText = QueueState.InQueu;
				socket.emit('enqueue');
			});
			LocalGameBtn.addEventListener("click", () => {
				if (queueBtn.innerText !== QueueState.Iddle || currentGame !== null) {
					showError("cant launch a local game while in queue/in game");
					return ;
				}
				socket.emit("localGame");
				queueBtn.innerText = QueueState.In_local;
				LocalGameBtn.innerText = "playing";
			});
			rdy_btn.addEventListener("click", ()=>{
				showInfo("rdy-evt");
				switch (rdy_btn.innerText) {
					case ReadyState.readyUp:
						socket.emit('readyUp');
						rdy_btn.innerText = ReadyState.readyDown;
						break ;
					case ReadyState.readyDown:
						socket.emit('readyDown');
						rdy_btn.innerText = ReadyState.readyUp;
						break ;
					default:
						showError("error on ready btn");
				}
			});

			socket.on('newGame', async (state) => {
				render(state);
				
				await get_opponent(state.left.id == user.id ? state.right.id : state.left.id);
				queueBtn.innerText = QueueState.InGame;
				queueBtn.style.color = 'red';
				batLeft.style.backgroundColor = DEFAULT_COLOR;
				batRight.style.backgroundColor = DEFAULT_COLOR;
				if (state.left.id === user.id) {
					set_pretty(batLeft, playerL, playerR, SELF_COLOR);
				} else if (state.right.id === user.id) {
					set_pretty(batRight, playerR, playerL, SELF_COLOR);
				} else
					showError("couldn't find your id in game");
				rdy_btn.classList.remove('hidden');
				rdy_btn.innerText = ReadyState.readyUp;
			});
			socket.on('rdyEnd', () => {
				rdy_btn.classList.add('hidden');
			});

			socket.on("gameEnd", (winner) => {
				rdy_btn.classList.remove('hidden');
				queueBtn.innerHTML = QueueState.Iddle;
				queueBtn.style.color = 'white';

				if (!isNullish(currentGame)) {
					let new_div = document.createElement('div');
					let end_txt = "";
					if ((user.id === currentGame.left.id && winner === 'left') ||
						(user.id === currentGame.right.id && winner === 'right'))
						end_txt = 'won! #yippe';
					else
						end_txt = 'lost #sadge';
					new_div.innerText = 'you ' + end_txt; 
					new_div.className = "pong-end-screen";
					gameBoard.appendChild(new_div);
					setTimeout(() => {
						new_div.remove();
					}, 3 * 1000);

					if (currentGame.local) {
						LocalGameBtn.innerText = "Local Game"
					}
				}
				resetBoard(batLeft, batRight, playerL, playerR);
			})
			// pretty info for queue :3
			socket.on('updateInformation', (e) => {
				queue_infos.innerText = `${e.totalUser}👤 ${e.inQueue}⏳ ${e.totalGames}▮•▮`;
			});
			socket.on('queueEvent', (e) => showInfo(`QueueEvent: ${e}`));
			// ---
			// queue evt end
			// ---

			// init
			rdy_btn.classList.add('hidden');
			queueBtn.innerText = QueueState.Iddle;
			rdy_btn.innerText = ReadyState.readyUp;
			resetBoard(batLeft, batRight, playerL, playerR);
			showInfo("butter");
			showInfo("butter-toast");
		}
	}
};
addRoute('/pong', pongClient);
