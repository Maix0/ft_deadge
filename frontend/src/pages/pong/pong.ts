import {
	addRoute,
	navigateTo,
	setTitle,
	type RouteHandlerParams,
	type RouteHandlerReturn,
} from "@app/routing";
import authHtml from "./pong.html?raw";
import io from "socket.io-client";
import type { CSocket, GameMove, GameUpdate } from "./socket";
import { showError, showInfo, showSuccess } from "@app/toast";
import { getUser, type User } from "@app/auth";
import { isNullish } from "@app/utils";
import client from "@app/api";
import "./pong.css";

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

document.addEventListener("ft:pageChange", (newUrl) => {
	if (window.__state.pongSock !== undefined) window.__state.pongSock.close();
	if (window.__state.pongKeepAliveInterval !== undefined) clearInterval(window.__state.pongKeepAliveInterval);
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
		window.__state.pongKeepAliveInterval = setInterval(() => { window.__state.pongSock?.emit("hello") }, 100);
	}
	return window.__state.pongSock;
}

function pongClient(_url: string, _args: RouteHandlerParams): RouteHandlerReturn {
	setTitle('Pong Game Page');
	const urlParams = new URLSearchParams(window.location.search);
	const game_req_join = urlParams.get("game");
	if (game_req_join) {
		showError("currently not supporting the act of joining game (even as a spectator)");
	}

	return {
		html: authHtml,
		postInsert: async (app) => {
			const DEFAULT_COLOR = "white";
			const SELF_COLOR = "red";

			const user = getUser();
			let currentGame: GameUpdate | null = null;
			let opponent: User | null = null;
			const rdy_btn =
				document.querySelector<HTMLButtonElement>("#readyup-btn");
			const batLeft = document.querySelector<HTMLDivElement>("#batleft");
			const batRight =
				document.querySelector<HTMLDivElement>("#batright");
			const ball = document.querySelector<HTMLDivElement>("#ball");
			const score =
				document.querySelector<HTMLDivElement>("#score-board");
			const playerL =
				document.querySelector<HTMLDivElement>("#player-left");
			const playerR =
				document.querySelector<HTMLDivElement>("#player-right");
			const queueBtn =
				document.querySelector<HTMLButtonElement>("#QueueBtn");
			const LocalGameBtn =
				document.querySelector<HTMLButtonElement>("#LocalBtn");
			const gameBoard =
				document.querySelector<HTMLDivElement>("#pongbox");
			const queue_infos =
				document.querySelector<HTMLSpanElement>("#queue-info");
			const how_to_play_btn =
				document.querySelector<HTMLButtonElement>("#play-info");
			const protips =
				document.querySelector<HTMLDivElement>("#protips-box");
			const end_scr =
				document.querySelector<HTMLDivElement>("#pong-end-screen");
			const tournamentBtn =
				document.querySelector<HTMLButtonElement>("#TourBtn");
			const tour_infos =
				document.querySelector<HTMLSpanElement>("#tour-info");

			let socket = getSocket();

			if (isNullish(user)) {
				// if no user (no loggin / other) : GTFO
				navigateTo("/app");
				return;
			}
			if (
				!batLeft ||
				!batRight ||
				!ball ||
				!score ||
				!queueBtn ||
				!playerL ||
				!playerR ||
				!gameBoard ||
				!queue_infos ||
				!LocalGameBtn ||
				!rdy_btn ||
				!end_scr ||
				!tournamentBtn ||
				!tour_infos
			)
				// sanity check
				return showError("fatal error");
			if (!how_to_play_btn || !protips) showError("missing protips"); // not a fatal error

			tournamentBtn.addEventListener("click", () => {
				showInfo(`Button State: ${tournamentBtn.innerText}`);

				switch (tournamentBtn.innerText) {
					case TourBtnState.AbleToStart:
						socket.emit('tourStart')
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

			// ---
			// keys handler
			// ---
			const keys: Record<string, boolean> = {};
			if (how_to_play_btn && protips)
				how_to_play_btn.addEventListener("click", () => {
					protips.classList.toggle("hidden");
					how_to_play_btn.innerText =
						how_to_play_btn.innerText === "?" ? "x" : "?";
				});

			document.addEventListener("keydown", (e) => {
				keys[e.key.toLowerCase()] = true;
			});
			document.addEventListener("keyup", (e) => {
				keys[e.key.toLowerCase()] = false;
			});

			setInterval(() => {
				// key sender
				if (keys["escape"] === true && protips && how_to_play_btn) {
					protips.classList.add("hidden");
					how_to_play_btn.innerText = "?";
				}
				if (queueBtn.innerText !== QueueState.InGame)
					//we're in game ? continue | gtfo
					return;
				if (currentGame === null) return;

				let packet: GameMove = {
					move: null,
					moveRight: null,
				};

				if (queueBtn.innerText !== QueueState.InGame)
					//we're in game ? continue | gtfo
					return;
				if (currentGame === null) return;

				if (keys["w"] !== keys["s"])
					packet.move = keys["w"] ? "up" : "down";
				if (currentGame.local && keys["o"] !== keys["l"])
					packet.moveRight = keys["o"] ? "up" : "down";
				socket.emit("gameMove", packet);
			}, 1000 / 60);
			// ---
			// keys end
			// ---

			// ---
			// position logic (client)
			// ---
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

			function resetBoard(
				batLeft: HTMLDivElement,
				batRight: HTMLDivElement,
				playerL: HTMLDivElement,
				playerR: HTMLDivElement,
			) {
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

				score.innerText = `${state.left.score} | ${state.right.score}`;
			};
			socket.on("gameUpdate", (state: GameUpdate) => {
				render(state);
			});

			socket.on("tourEnding", (ending) => {
				showInfo(ending);
			})
			// ---
			// position logic (client) end
			// ---

			// ---
			// queue evt
			// ---
			// utils
			function set_pretty(
				batU: HTMLDivElement,
				txtU: HTMLDivElement,
				txtO: HTMLDivElement,
				colorYou: string,
			) {
				batU.style.backgroundColor = colorYou;
				txtU.style.color = colorYou;
				txtU.innerText = isNullish(user) ? "you" : user.name;
				txtO.innerText = isNullish(opponent)
					? "the mechant"
					: opponent.name;
			}
			async function get_opponent(opponent_id: string) {
				let t = await client.getUser({ user: opponent_id });

				switch (t.kind) {
					case "success":
						opponent = t.payload;
						break;
					default:
						opponent = null;
				}
			}

			// btn setup
			queueBtn.addEventListener("click", () => {
				if (queueBtn.innerText !== QueueState.Iddle) {
					if (queueBtn.innerText === QueueState.InQueu) {
						socket.emit("dequeue");
						queueBtn.innerText = QueueState.Iddle;
					}
					return;
				}
				queueBtn.innerText = QueueState.InQueu;
				socket.emit("enqueue");
			});
			LocalGameBtn.addEventListener("click", () => {
				if (
					queueBtn.innerText !== QueueState.Iddle ||
					currentGame !== null
				) {
					showError(
						"cant launch a local game while in queue/in game",
					);
					return;
				}
				socket.emit("localGame");
				queueBtn.innerText = QueueState.In_local;
				LocalGameBtn.innerText = "playing";
			});
			rdy_btn.addEventListener("click", () => {
				showInfo("rdy-evt");
				switch (rdy_btn.innerText) {
					case ReadyState.readyDown:
						socket.emit("readyUp");
						rdy_btn.innerText = ReadyState.readyUp;
						rdy_btn.classList.remove("text-red-600");
						rdy_btn.classList.add("text-green-600");
						break;
					case ReadyState.readyUp:
						socket.emit("readyDown");
						rdy_btn.innerText = ReadyState.readyDown;
						rdy_btn.classList.remove("text-green-600");
						rdy_btn.classList.add("text-red-600");
						break;
					default:
						showError("error on ready btn");
				}
			});

			socket.on("newGame", async (state) => {
				render(state);

				await get_opponent(
					state.left.id == user.id ? state.right.id : state.left.id,
				);
				queueBtn.innerText = QueueState.InGame;
				queueBtn.style.color = "red";
				batLeft.style.backgroundColor = DEFAULT_COLOR;
				batRight.style.backgroundColor = DEFAULT_COLOR;
				if (state.left.id === user.id) {
					set_pretty(batLeft, playerL, playerR, SELF_COLOR);
				} else if (state.right.id === user.id) {
					set_pretty(batRight, playerR, playerL, SELF_COLOR);
				} else showError("couldn't find your id in game");
				rdy_btn.classList.remove("hidden");
				rdy_btn.classList.add("text-red-600");
				rdy_btn.innerText = ReadyState.readyDown;
			});
			socket.on("rdyEnd", () => {
				rdy_btn.classList.remove("text-green-600");
				rdy_btn.classList.remove("text-red-600");
				rdy_btn.classList.add("hidden");
			});

			socket.on("gameEnd", (winner) => {
				rdy_btn.classList.add("hidden");
				queueBtn.innerHTML = QueueState.Iddle;
				queueBtn.style.color = "white";

				if (!isNullish(currentGame)) {
					let end_txt: string = '';
					if ((user.id === currentGame.left.id && winner === 'left') ||
						(user.id === currentGame.right.id && winner === 'right'))
						end_txt = 'won! #yippe';
					else
						end_txt = 'lost #sadge';
					end_scr.innerText = 'you ' + end_txt;
					end_scr.classList.remove("hidden");
					setTimeout(() => {
						end_scr.classList.add("hidden");
					}, 3 * 1000);

					if (currentGame.local) {
						LocalGameBtn.innerText = "Local Game";
					}
				}
				resetBoard(batLeft, batRight, playerL, playerR);
			});
			socket.on("updateInformation", (e) => {
				queue_infos.innerText = `${e.totalUser}👤 ${e.inQueue}⏳ ${e.totalGames}▮•▮`;
			});
			socket.on("queueEvent", (e) => showInfo(`QueueEvent: ${e}`)); // MAYBE: play a sound? to notify user that smthing happend
			// ---
			// queue evt end
			// ---

			socket.on("tournamentInfo", (s) => {
				// no tournament => we can create it !
				if (s === null) {
					tournamentBtn.innerText = TourBtnState.AbleToCreate;
					// create tournament
					tour_infos.innerText = `${TourInfoState.NoTournament} 0👤 0▮•▮`;
					return;
				}

				let weIn = s.players.some((p) => p.id === user.id);
				let imOwner = s.ownerId === user.id;
				// TODO: fix this so the number of remaining games are correct
				switch (s.state) {
					case "ended":
						tournamentBtn.innerText = TourBtnState.AbleToCreate;
						break;
					case "playing":
						tournamentBtn.innerText = TourBtnState.Started;
						tour_infos.innerText = `${TourInfoState.Running} ${s.players.length}👤 ?▮•▮`;
						break;
					case "prestart":
						tour_infos.innerText = `${imOwner ? TourInfoState.Owner : (weIn ? TourInfoState.Registered : TourInfoState.NotRegisted)} ${s.players.length}👤 ?▮•▮`;
						if (imOwner) {
							tournamentBtn.innerText = TourBtnState.AbleToStart;
						} else {
							tournamentBtn.innerText = weIn
								? TourBtnState.Joined
								: TourBtnState.AbleToJoin;
						}
						break;
				}
			});

			socket.on("tournamentRegister", ({ kind, msg }) => {
				if (kind === "success") showSuccess(msg ?? "Success");
				if (kind === "failure") showError(msg ?? "An error Occured");
			});

			// init
			rdy_btn.classList.add("hidden");
			queueBtn.innerText = QueueState.Iddle;
			rdy_btn.innerText = ReadyState.readyUp;
			resetBoard(batLeft, batRight, playerL, playerR);
		},
	};
}
addRoute("/pong", pongClient);
