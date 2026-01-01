import { addRoute, type RouteHandlerReturn } from "@app/routing";
import tttPage from "./ttt.html?raw";
import { showError, showInfo, showSuccess } from "@app/toast";
import { io } from "socket.io-client";
import type { CSocket as Socket } from "./socket";


declare module 'ft_state' {
	interface State {
		tttSock?: Socket;
	}
}

document.addEventListener("ft:pageChange", () => {
	if (window.__state.tttSock !== undefined) window.__state.tttSock.close();
	window.__state.tttSock = undefined;
});

export function getSocket(): Socket {
	if (window.__state.tttSock === undefined)
		window.__state.tttSock = io(window.location.host, { path: "/api/ttt/socket.io/" }) as any as Socket;
	return window.__state.tttSock;
}

// Route handler for the Tic-Tac-Toe page.
// Instantiates the game logic and binds UI events.
async function handleTTT(): Promise<RouteHandlerReturn> {
	const socket: Socket = getSocket();
	void socket;
	return {
		html: tttPage,
		postInsert: async (app) => {
			if (!app) {
				return;
			}

			socket.on('updateInformation', (e) => showInfo(`UpdateInformation: t=${e.totalUser};q=${e.inQueue}`));
			socket.on('queueEvent', (e) => showInfo(`QueueEvent: ${e}`));
			socket.on('newGame', (e) => showInfo(`newGame: ${e}`));
			socket.emit('enqueue');

			const cells = app.querySelectorAll<HTMLDivElement>(".ttt-grid-cell");
			const grid = app.querySelector(".ttt-grid"); // Not sure about this one

			const updateUI = (boardState: (string | null)[]) => {
				boardState.forEach((state, idx) => {
					cells[idx].innerText = state || " ";
				});
			};

			socket.on('gameBoard', (u) => {
				updateUI(u.boardState);

				if (u.gameState && u.gameState !== "ongoing") {
					grid?.classList.add("pointer-events-none");
					if (u.gameState === "winX") {
						showSuccess("X won !");
					}
					if (u.gameState === "winO") {
						showSuccess("O won !");
					}
					if (u.gameState === "draw") {
						showInfo("Draw !");
					}
					if (u.gameState === 'concededX' )
					{
						showInfo("concededX");
					}
					if (u.gameState === 'concededO' )
					{
						showInfo("concededO");
					}
				}
			});

			cells?.forEach(function(c, idx) {
				c.addEventListener("click", () => {
					socket.emit("gameMove", { index: idx });
				});
			});
		},
	};
}

addRoute("/ttt", handleTTT);

