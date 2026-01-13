import "./ttt.css"
import {addRoute, setTitle, type RouteHandlerReturn} from "@app/routing";
import tttPage from "./ttt.html?raw";
import {showError, showInfo} from "@app/toast";
import {io} from "socket.io-client";
import type {CSocket as Socket, GameUpdate} from "./socket";
import {updateUser} from "@app/auth";
import client from "@app/api";


declare module 'ft_state' {
    interface State {
        tttSock?: Socket;
        tttkeepAliveInterval?: ReturnType<typeof setInterval>;
    }
}

enum QueueState {
    InQueue = "In Queue",
    InGame = "In Game",
    Idle = "Join Queue",
}

document.addEventListener("ft:pageChange", () => {
    if (window.__state.tttSock !== undefined) window.__state.tttSock.close();
    if (window.__state.tttkeepAliveInterval !== undefined) clearInterval(window.__state.tttkeepAliveInterval);
    window.__state.tttSock = undefined;
    window.__state.tttkeepAliveInterval = undefined;
});

export function getSocket(): Socket {
    if (window.__state.tttSock === undefined)
        window.__state.tttSock = io(window.location.host, {path: "/api/ttt/socket.io/"}) as any as Socket;
    if (window.__state.tttkeepAliveInterval === undefined)
        window.__state.tttkeepAliveInterval = setInterval(() => window.__state.tttSock?.emit('keepalive'), 100);
    return window.__state.tttSock;
}

type CurrentGameInfo = GameUpdate & { lastState: GameUpdate['gameState'] | null };

// Route handler for the Tic-Tac-Toe page.
// Instantiates the game logic and binds UI events.
async function handleTTT(): Promise<RouteHandlerReturn> {
	setTitle("Tic Tac Toe");
    const msgNotifTimeOut = 4 * 1000;
    const socket: Socket = getSocket();
    void socket;
    return {
        html: tttPage, postInsert: async (app) => {
            if (!app) {
                return;
            }
            let user = await updateUser();
            if (user === null)
                return;

            const userXString = document.getElementById("playerX-name");
            const userOString = document.getElementById("playerO-name");
            const currentPlayerIndicator = document.getElementById("currentPlayer");
            const joinQueueBtn = document.getElementById("JoinQueueBtn");
            const currentPlayerTimer = document.getElementById("currentPlayerTimer")
            const result_message = document.getElementById("ttt-end-screen");
            if (!userXString || !userOString || !currentPlayerIndicator || !joinQueueBtn || !currentPlayerTimer || !result_message) {
                return showError('fatal error');
            }

            joinQueueBtn.addEventListener("click", () => {
                console.log('===== JOIN QUEUE BUTTON PRESSED =====');
                if (joinQueueBtn.innerText !== QueueState.Idle) {
                    console.log("== Entering in first if ==");
                    if (joinQueueBtn.innerText === QueueState.InQueue) {
                        console.log("== Entering in second if ==");
                        socket.emit("dequeue");
                        joinQueueBtn.innerText = QueueState.Idle;
                    }
                    return;
                }
                joinQueueBtn.innerText = QueueState.InQueue;
                socket.emit("enqueue");
            });

            let curGame: CurrentGameInfo | null = null;
            let curGameX: { id: string, name: string } | null = null;
            let curGameO: { id: string, name: string } | null = null;

            socket.on('updateInformation', (e) => showInfo(`UpdateInformation: t=${e.totalUser};q=${e.inQueue}`));
            socket.on('queueEvent', (e) => showInfo(`QueueEvent: ${e}`));
            socket.on('newGame', async (gameState) => {
                showInfo(`newGame: ${gameState.gameId}`)

                currentPlayerTimer.innerText = "";
                joinQueueBtn.innerText = QueueState.InGame;
                curGame = {...gameState, lastState: null};

                let resX = await client.getUser({user: curGame.playerX});

                curGameX = {id: curGame.playerX, name: 'Player X'};
                if (resX.kind === 'success')
                    curGameX.name = resX.payload.name;
                else
                    showError(`Unable to get player information: ${resX.msg}`);
                let resO = await client.getUser({user: curGame.playerO});

                curGameO = {id: curGame.playerO, name: 'Player O'};
                if (resO.kind === 'success')
                    curGameO.name = resO.payload.name;
                else
                    showError(`Unable to get player information: ${resO.msg}`);

                if (user.id === curGameO.id) {
                    userOString.classList.add('text-red-800');
                    userOString.classList.remove('text-gray-800');
                    userXString.classList.remove('text-red-800');
                    userXString.classList.add('text-gray-800');
                } else if (user.id === curGameX.id) {
                    userXString.classList.add('text-red-800');
                    userXString.classList.remove('text-gray-800');
                    userOString.classList.remove('text-red-800');
                    userOString.classList.add('text-gray-800');
                }
                userXString.innerText = curGameX.name;
                userOString.innerText = curGameO.name;
            });

            const cells = app.querySelectorAll<HTMLDivElement>(".ttt-cell");

            const updateUI = (boardState: (string | null)[]) => {
                boardState.forEach((state, idx) => {
                    cells[idx].innerText = state || " ";
                });
            };

            const makeEnd = (type: 'win' | 'conceded' | 'draw', player: 'X' | 'O') => {
                if (type === 'draw') {
                    result_message.innerText = "It's a draw! :/";
                    result_message.classList.remove("hidden");
                    setTimeout(() => {
                        result_message.classList.add("hidden");
                    }, msgNotifTimeOut);
                }

                if (type === 'win') {
                    let youWin: boolean;
                    switch (player) {
                        case 'X':
                            youWin = (curGame?.playerX === user.id);
                            break;
                        case 'O':
                            youWin = (curGame?.playerO === user.id);
                            break;
                        default:
                            return;
                    }
                    if (youWin) {
                        result_message.innerText = "You won the game! :)";
                        result_message.classList.remove("hidden");
                        setTimeout(() => {
                            result_message.classList.add("hidden");
                        }, msgNotifTimeOut);
                    } else {
                        result_message.innerText = "You lost the game! :(";
                        result_message.classList.remove("hidden");
                        setTimeout(() => {
                            result_message.classList.add("hidden");
                        }, msgNotifTimeOut);
                    }
                }
            };

            socket.on('gameEnd', () => {
                curGame = null;
                currentPlayerTimer.innerText = "Waiting for match...";
                joinQueueBtn.innerText = QueueState.Idle;
            })

            socket.on('gameBoard', (u) => {
                if (curGame === null) {
                    return showError('Got game State, but no in a game ?');
                }

                curGame = {...u, lastState: curGame.lastState};

                if (curGame.currentPlayer === 'X') {
                    currentPlayerIndicator.innerText = "<";
                } else if (curGame.currentPlayer === 'O') {
                    currentPlayerIndicator.innerText = ">";
                }

                updateUI(u.boardState);

                if (u.gameState && u.gameState !== "ongoing") {
                    if (u.gameState !== curGame.lastState) {
                        curGame.lastState = u.gameState;
                        switch (u.gameState) {
                            case 'winX':
                            case 'winO':
                                makeEnd('win', u.gameState[3] as 'X' | 'O');
                                break;
                            default:
                                makeEnd('draw', 'X');
                                break;
                        }
                    }
                }
            });

            cells?.forEach(function (c, idx) {
                c.addEventListener("click", () => {
                    if (socket) {
                        socket.emit("gameMove", {index: idx});
                    }
                });
            });
        },
    };
}

addRoute("/ttt", handleTTT);

