import { addRoute, type RouteHandlerReturn } from "@app/routing";
import tttPage from "./ttt.html?raw";
import { showError, showInfo, showSuccess } from "@app/toast";
import { io, Socket } from "socket.io-client";

// get the name of the machine used to connect
const machineHostName = window.location.hostname;
console.log(
	"connect to login at https://" + machineHostName + ":8888/app/login",
);

export let __socket: Socket | undefined = undefined;
document.addEventListener("ft:pageChange", () => {
	if (__socket !== undefined) __socket.close();
	__socket = undefined;
	console.log("Page changed");
});

export function getSocket(): Socket {
	let addressHost = `wss://${machineHostName}:8888`;
	// let addressHost = `wss://localhost:8888`;
	if (__socket === undefined)
		__socket = io(addressHost, {
			path: "/api/ttt/socket.io/",
			secure: true,
			transports: ["websocket"],
		});
	return __socket;
}

// Route handler for the Tic-Tac-Toe page.
// Instantiates the game logic and binds UI events.
async function handleTTT(): Promise<RouteHandlerReturn> {
	const socket: Socket = getSocket();

	return {
		html: tttPage,
		postInsert: async (app) => {
			if (!app) {
				return;
			}

			const cells =
				app.querySelectorAll<HTMLDivElement>(".ttt-grid-cell");
			const restartBtn =
				app.querySelector<HTMLButtonElement>("#ttt-restart-btn");
			const grid = app.querySelector(".ttt-grid"); // Not sure about this one

			const updateUI = (boardState: (string | null)[]) => {
				boardState.forEach((state, idx) => {
					cells[idx].innerText = state || " ";
				});
			};

			socket.on("gameState", (data) => {
				updateUI(data.board);

				if (data.lastResult && data.lastResult !== "ongoing") {
					grid?.classList.add("pointer-events-none");
					if (data.lastResult === "winX") {
						showSuccess("X won !");
					}
					if (data.lastResult === "winO") {
						showSuccess("O won !");
					}
					if (data.lastResult === "draw") {
						showInfo("Draw !");
					}
				}

				if (data.reset) {
					grid?.classList.remove("pointer-events-none");
					showInfo("Game Restarted");
				}
			});

			socket.on("error", (msg) => {
				showError(msg);
			});

			cells?.forEach(function(c, idx) {
				c.addEventListener("click", () => {
					socket.emit("makeMove", idx);
				});
			});

			restartBtn?.addEventListener("click", () => {
				socket.emit("resetGame");
			});
		},
	};
}

addRoute("/ttt", handleTTT);

