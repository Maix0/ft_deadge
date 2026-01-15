import {
	addRoute,
	navigateTo,
	setTitle,
	type RouteHandlerParams,
	type RouteHandlerReturn,
} from "@app/routing";
import authHtml from "./pong.html?raw";
import tourScoresHtml from "./tourTable.html?raw";
import io from "socket.io-client";
import {
	JoinRes,
	type CSocket,
	type GameMove,
	type GameUpdate,
	type TourInfo,
} from "./socket";
import { showError, showInfo, showSuccess } from "@app/toast";
import { getUser as getSelfUser, type User } from "@app/auth";
import { isNullish } from "@app/utils";
import client from "@app/api";
import "./pong.css";
import { quitChat } from "@app/chat/chatHelperFunctions/quitChat";

declare module "ft_state" {
	interface State {
		pongSock?: CSocket;
		pongKeepAliveInterval?: ReturnType<typeof setInterval>;
	}
}

enum QueueState {
	InQueu = "In Queue",
	InGame = "In Game",
	Ready = "Ready-ing",
	Iddle = "Queue Up",
	In_local = "In Local",
}

enum ReadyState {
	readyUp = "ready ok",
	readyDown = "not ready",
}

enum TourBtnState {
	Joined = "Joined",
	Started = "Started",
	AbleToJoin = "Join Tournament",
	AbleToCreate = "Create Tournament",
	AbleToStart = "Start Tournament",
	AbeToProcreate = "He would be proud",
}

enum TourInfoState {
	Running = "🟢",
	Owner = "👑",
	Registered = "✅",
	NotRegisted = "❌",
	NoTournament = "⚪️",
}

type gamePlayer = {id: string, name: string | Promise<string>, self: boolean};

type currentGameInfo = {
	game: GameUpdate;
	spectating: boolean;
	playerL: gamePlayer;
	playerR: gamePlayer;
}



document.addEventListener("ft:pageChange", (newUrl) => {
	if (window.__state.pongSock !== undefined) window.__state.pongSock.close();
	if (window.__state.pongKeepAliveInterval !== undefined)
		clearInterval(window.__state.pongKeepAliveInterval);
	window.__state.pongSock = undefined;
	window.__state.pongKeepAliveInterval = undefined;
});

export function getSocket(): CSocket {
	if (window.__state.pongSock === undefined) {
		window.__state.pongSock = io(window.location.host, {
			path: "/api/pong/socket.io/",
		}) as any as CSocket;
	}
	if (window.__state.pongKeepAliveInterval === undefined) {
		window.__state.pongKeepAliveInterval = setInterval(() => {
			window.__state.pongSock?.emit("hello");
		}, 100);
	}
	return window.__state.pongSock;
}

function playhowButtons(button : HTMLButtonElement, screen : HTMLDivElement)
{
	button.addEventListener("click", () => {
		screen.classList.toggle("hidden");
		button.innerText = (button.innerText === "?" ? "x" : "?");
	});
}

function tourinfoButtons(tourInfo : HTMLButtonElement, tourScoreScreen : HTMLDivElement)
{
	tourInfo.addEventListener("click", () => {
		tourScoreScreen.classList.toggle("hidden");
	});
}

function gameJoinButtons(socket : CSocket, inTournament : boolean, currentGame : currentGameInfo | null, 
	tournament : HTMLButtonElement, queue : HTMLButtonElement, localGame : HTMLButtonElement, ready : HTMLButtonElement)
{
	tournament.addEventListener("click", () => {
		switch (tournament.innerText) {
			case TourBtnState.AbleToStart:
				socket.emit("tourStart");
				break;
			case TourBtnState.AbleToJoin:
				socket.emit("tourRegister");
				break;
			case TourBtnState.AbleToCreate:
				socket.emit("tourCreate");
				break;
			case TourBtnState.AbeToProcreate:
				showError("We are developpers, this is impossible !");
				break;
			case TourBtnState.Joined:
				socket.emit("tourUnregister");
				break;
			case TourBtnState.Started:
				break;
		}
	});
	queue.addEventListener("click", () => {
		if (inTournament) {
			showError("You can't queue up currently !");
			return;
		}
		switch (queue.innerText) {
			case (QueueState.Iddle) : 
				queue.innerText = QueueState.InQueu;
				socket.emit("enqueue");
				break ;
			case (QueueState.InQueu) :
				queue.innerText = QueueState.Iddle;
				socket.emit("dequeue");
				break ;
			default :
				showError("Queue event are disabled currently");
		}
	});
	localGame.addEventListener("click", () => {
		if (
			queue.innerText !== QueueState.Iddle ||
			currentGame !== null ||
			inTournament
		) {
			showError("cant launch a game currently");
			return;
		}
		socket.emit("localGame");
		queue.innerText = QueueState.In_local;
		localGame.innerText = "playing";
	});
	ready.addEventListener("click", () => {
		switch (ready.innerText) {
			case ReadyState.readyDown:
				socket.emit("readyUp");
				ready.innerText = ReadyState.readyUp;
				ready.classList.remove("text-red-600");
				ready.classList.add("text-green-600");
				break;
			case ReadyState.readyUp:
				socket.emit("readyDown");
				ready.innerText = ReadyState.readyDown;
				ready.classList.remove("text-green-600");
				ready.classList.add("text-red-600");
				break;
			default:
				showError("error on ready btn");
		}
	});
}
function resetPureBoard(batLeft: HTMLDivElement, batRight: HTMLDivElement, playerL: HTMLDivElement, playerR: HTMLDivElement, ball : HTMLDivElement, playInfo: HTMLDivElement) {
	const DEFAULT_POSITIONS: GameUpdate = {
		gameId: "",
		ball: { size: 16, x: 800 / 2, y: 450 / 2 },
		left: {
			id: "",
			paddle: { x: 40, y: 185, width: 12, height: 80 },
			score: 0,
		},
		right: {
			id: "",
			paddle: { x: 748, y: 185, width: 12, height: 80 },
			score: 0,
		},
		local: false,
	};

	render(DEFAULT_POSITIONS, batLeft, batRight, ball, playInfo);
	batLeft.style.backgroundColor = "white";
	batRight.style.backgroundColor = "white";
	playerR.style.color = "";
	playerL.style.color = "";
	playerR.innerText = "";
	playerL.innerText = "";
};

function keys_listen_setup(currentGame : currentGameInfo | null, socket : CSocket,
	keys : Record<string, boolean>,
	playHow : HTMLDivElement, playHow_b : HTMLButtonElement,
	tourScoreScreen : HTMLDivElement, queue : HTMLButtonElement)
{
	const keysP1 = {up:'w', down:'s'};
	const keysP2 = {up:'p', down:'l'};

	let packet: GameMove = {
		move: null,
		moveRight: null,
	};

	// key sender
	if (keys["escape"] === true) {
		playHow.classList.add("hidden");
		tourScoreScreen.classList.add("hidden");
		playHow_b.innerText = "?";
	}
	if (queue.innerText !== QueueState.InGame || currentGame === null)
		return;
	if (keys[keysP1.up] !== keys[keysP1.down])
		packet.move = keys[keysP1.up] ? "up" : "down";
	if (currentGame.game.local && keys[keysP2.up] !== keys[keysP2.down])
		packet.moveRight = keys[keysP2.up] ? "up" : "down";
	socket.emit("gameMove", packet);
}
function render(state: GameUpdate, playBatL : HTMLDivElement, playBatR : HTMLDivElement, ball :HTMLDivElement, playInfo : HTMLDivElement) {
	playBatL.style.top = `${state.left.paddle.y}px`;
	playBatL.style.left = `${state.left.paddle.x}px`;
	playBatL.style.width = `${state.left.paddle.width}px`;
	playBatL.style.height = `${state.left.paddle.height}px`;

	playBatR.style.top = `${state.right.paddle.y}px`;
	playBatR.style.left = `${state.right.paddle.x}px`;
	playBatR.style.width = `${state.right.paddle.width}px`;
	playBatR.style.height = `${state.right.paddle.height}px`;

	ball.style.transform = `translateX(${state.ball.x - state.ball.size}px) translateY(${state.ball.y - state.ball.size}px)`;
	ball.style.height = `${state.ball.size * 2}px`;
	ball.style.width = `${state.ball.size * 2}px`;

	playInfo.innerText = `${state.left.score} | ${state.right.score}`;
};

function normalizeUser(
	id: string,
	u: Promise<{ id: string; name: string | null }>,
	def: string,
): gamePlayer {

	let user = getSelfUser();

	return {
		id: id,
		name: u.then( u => u.name ?? def),
		self: id === user?.id,
	};
};

function pongClient(
	_url: string,
	_args: RouteHandlerParams,
): RouteHandlerReturn {
	setTitle("Pong Game");
	const urlParams = new URLSearchParams(window.location.search);
	let game_req_join = urlParams.get("game");
	let inTournament = false;

	return {
		html: authHtml,
		postInsert: async (app) => {
			const DEFAULT_COLOR = "white";
			const SELF_COLOR = "red";

			const user = getSelfUser();
			let currentGame: currentGameInfo | null = null;

			// game
			const playBatL = document.querySelector<HTMLDivElement>("#batleft");
			const playBatR = document.querySelector<HTMLDivElement>("#batright");
			const ball = document.querySelector<HTMLDivElement>("#ball");
			const playInfo = document.querySelector<HTMLDivElement>("#score-board");
			const playNameL = document.querySelector<HTMLDivElement>("#player-left");
			const playNameR = document.querySelector<HTMLDivElement>("#player-right");
			const gameBoard = document.querySelector<HTMLDivElement>("#pongbox");
			const endScreen = document.querySelector<HTMLDivElement>("#pong-end-screen");

			// queue
			const queue = document.querySelector<HTMLButtonElement>("#QueueBtn");
			const queueInfo = document.querySelector<HTMLSpanElement>("#queue-info");
			const ready = document.querySelector<HTMLButtonElement>("#readyup-btn");
			const localGame = document.querySelector<HTMLButtonElement>("#LocalBtn");

			// tournament
			const tournament = document.querySelector<HTMLButtonElement>("#TourBtn");
			const tourInfo = document.querySelector<HTMLButtonElement>("#tour-info");
			const tourScoreScreen = document.querySelector<HTMLDivElement>("#tourscore-box");

			// how to play
			const playHow_b = document.querySelector<HTMLButtonElement>("#play-info");
			const playHow = document.querySelector<HTMLDivElement>("#protips-box");

			let socket = getSocket();

			if (isNullish(user)) {
				// if no user (no loggin / other) : GTFO
				navigateTo("/app");
				return;
			}
			if (!playBatL || !playBatR || !ball ||
				!playInfo || !playNameL || !playNameR ||
				!gameBoard || !endScreen ||
				!queue || !queueInfo || !ready || !localGame ||
				!tournament || !tourInfo || !tourScoreScreen ||
				!playHow_b || !playHow
			)
				return showError("fatal error");
			// ---
			// position logic (client)
			// ---
			let render_tour_score_once = false;

			function resetBoard(batLeft: HTMLDivElement, batRight: HTMLDivElement, playerL: HTMLDivElement, playerR: HTMLDivElement, ball : HTMLDivElement, playInfo: HTMLDivElement) {
				resetPureBoard(batLeft, batRight, playerL, playerR, ball, playInfo);
				currentGame = null;
			}
			const renderTournamentScores = (info: TourInfo) => {
				let players = info.players.sort((l, r) => r.score - l.score);

				const medals = ["🥇", "🥈", "🥉"];
				if (!render_tour_score_once) {
					tourScoreScreen.innerHTML = tourScoresHtml;
					render_tour_score_once = true;
				}
				let table = tourScoreScreen.querySelector("#tour-score-body");
				let table_shadow = document.createElement("tbody");
				if (table) {
					table_shadow.innerHTML = players
						.map(
							(player, idx) =>
								`<tr class="${player.id === user.id ? "bg-amber-400 hover:bg-amber-500" : "hover:bg-gray-50"}" data-id="${player.id}">
								<td class="px-4 py-2 text-sm text-gray-800 text-center border-b font-semibold min-w-100px"><span class="font-lg medal">${idx < medals.length ? medals[idx] : ""}</span>${player.name}</td>
								<td class="px-4 py-2 text-sm text-gray-800 text-center border-b font-bold min-w-100px">${player.score}</td>
							</tr>`,
						)
						.join("");
					if (table_shadow.innerHTML !== table.innerHTML) {
						table.innerHTML = table_shadow.innerHTML;
					}
				}
			};

			socket.on("gameUpdate", async (state: GameUpdate) => {
				await updateCurrentGame(state);
				render(state, playBatL, playBatR, ball, playInfo);
			});

			socket.on("tourEnding", (ending) => {
				inTournament = false;
				showInfo(ending);
			});
			// ---
			// position logic (client) end
			// ---

			// ---
			// queue evt
			// ---
			// utils
			async function getUser(
				user: string,
			): Promise<{ id: string; name: string | null }> {
				let t = await client.getUser({ user });

				if (t.kind === "success")
					return { id: user, name: t.payload.name };
				return { id: user, name: null };
			}

			const updateCurrentGame = async (state: GameUpdate) => {
				if (currentGame === null) {
					currentGame = {
						spectating: !(
							state.left.id === user.id ||
							state.right.id === user.id
						),
						game: state,
						playerL: normalizeUser(
							state.left.id,
							getUser(state.left.id),
							"left",
						),
						playerR: normalizeUser(
							state.right.id,
							getUser(state.right.id),
							"right",
						),
					};
				}
				else {
					currentGame.game = state;
				}
				if (
					(currentGame && currentGame?.game.local) ||
					currentGame?.playerL.self
				) {
					playBatL!.style.backgroundColor = SELF_COLOR;
					playNameL!.style.color = SELF_COLOR;
				}
				if (
					currentGame &&
					!currentGame?.game.local &&
					currentGame?.playerR.self
				) {
					playBatR!.style.backgroundColor = SELF_COLOR;
					playNameR!.style.color = SELF_COLOR;
				}
				if (currentGame!.playerL.name instanceof Promise)
					currentGame!.playerL.name.then(n => currentGame!.playerL.name = n)
				if (currentGame!.playerR.name instanceof Promise)
					currentGame!.playerR.name.then(n => currentGame!.playerR.name = n)
				playNameL!.innerText = typeof currentGame!.playerL.name === 'string' ? currentGame!.playerL.name : "left";
				playNameR!.innerText = typeof currentGame!.playerR.name === 'string' ? currentGame!.playerR.name : "right";
			};

			socket.on("newGame", async (state) => {
				currentGame = null;
				await updateCurrentGame(state);
				render(state, playBatL, playBatR, ball, playInfo);

				tourScoreScreen.classList.add("hidden");
				queue.innerText = QueueState.InGame;
				queue.style.color = "red";
				playBatL.style.backgroundColor = DEFAULT_COLOR;
				playBatR.style.backgroundColor = DEFAULT_COLOR;
				ready.classList.remove("hidden");
				ready.classList.add("text-red-600");
				ready.innerText = ReadyState.readyDown;
			});
			socket.on("rdyEnd", () => {
				ready.classList.remove("text-green-600");
				ready.classList.remove("text-red-600");
				ready.classList.add("hidden");
			});

			socket.on("gameEnd", (winner) => {
				ready.classList.add("hidden");
				queue.innerHTML = QueueState.Iddle;
				queue.style.color = "white";

				if (!isNullish(currentGame)) {
					let end_txt: string = "";
					if (
						(user.id === currentGame.game.left.id &&
							winner === "left") ||
						(user.id === currentGame.game.right.id &&
							winner === "right")
					)
						end_txt = "you won! #yippe";
					else end_txt = "you lost #sadge";
					if (currentGame.spectating)
						end_txt = `${winner === "left" ? currentGame.playerL.name : currentGame.playerR.name} won #gg`;
					endScreen.innerText = end_txt;
					endScreen.classList.remove("hidden");
					setTimeout(() => {
						endScreen.classList.add("hidden");
					}, 3 * 1000);

					if (currentGame.game.local) {
						localGame.innerText = "Local Game";
					}
				}
				resetBoard(playBatL, playBatR, playNameL, playNameR, ball, playInfo);
			});
			socket.on("updateInformation", (e) => {
				queueInfo.innerText = `${e.totalUser}👤 ${e.inQueue}⏳ ${e.totalGames}▮•▮`;
			});
			socket.on("queueEvent", (e) => {
				if (e === "registered") queue.innerText = QueueState.InQueu;
				else if (e === "unregistered")
					queue.innerText = QueueState.Iddle;
			});
			// ---
			// queue evt end
			// ---

			socket.on("tournamentInfo", (s) => {
				// no tournament => we can create it !
				if (s === null) {
					tournament.innerText = TourBtnState.AbleToCreate;
					// create tournament
					tourInfo.innerText = `${TourInfoState.NoTournament} 0👤 0▮•▮`;
					return;
				}

				let weIn = s.players.some((p) => p.id === user.id);
				let imOwner = s.ownerId === user.id;
				switch (s.state) {
					case "ended":
						inTournament = false;
						tournament.innerText = TourBtnState.AbleToCreate;
						break;
					case "playing":
						inTournament = weIn;
						tournament.innerText = TourBtnState.Started;
						tourInfo.innerText = `${TourInfoState.Running} ${s.players.length}👤 ${s.remainingMatches ?? "?"}▮•▮`;
						break;
					case "prestart":
						inTournament = weIn;
						tourInfo.innerText = `${imOwner ? TourInfoState.Owner : weIn ? TourInfoState.Registered : TourInfoState.NotRegisted} ${s.players.length}👤 ?▮•▮`;
						if (imOwner) {
							tournament.innerText = TourBtnState.AbleToStart;
						} else {
							tournament.innerText = weIn
								? TourBtnState.Joined
								: TourBtnState.AbleToJoin;
						}
						break;
				}
				renderTournamentScores(s);
			});

			socket.on("tournamentRegister", ({ kind, msg }) => {
				if (kind === "success") showSuccess(msg ?? "Success");
				if (kind === "failure") showError(msg ?? "An error Occured");
			});

			// ---
			// init
			// ---
			const keys: Record<string, boolean> = {};
			document.addEventListener("keydown", (e) => {
				keys[e.key.toLowerCase()] = true;
			});
			document.addEventListener("keyup", (e) => {
				keys[e.key.toLowerCase()] = false;
			});

			setInterval(() => {keys_listen_setup(currentGame, socket, keys, playHow, playHow_b, tourScoreScreen, queue)}, 1000 / 60);

			gameJoinButtons(socket, inTournament, currentGame, tournament, queue, localGame, ready);
			playhowButtons(playHow_b, playHow);
			tourinfoButtons(tourInfo, tourScoreScreen);

			if (game_req_join != null) {
				socket.emit("joinGame", game_req_join, (res: JoinRes) => {
					switch (res) {
						case JoinRes.yes:
							showInfo("Joined game with success");
							quitChat();
							break;
						case JoinRes.no:
							showInfo("You cannot access this game");
							break;
						default:
							showError("Joining game failed" + res);
					}
				});
				game_req_join = null;
			}
			ready.classList.add("hidden");
			queue.innerText = QueueState.Iddle;
			ready.innerText = ReadyState.readyUp;
			resetBoard(playBatL, playBatR, playNameL, playNameR, ball, playInfo);
		},
	};
}
addRoute("/pong", pongClient);
