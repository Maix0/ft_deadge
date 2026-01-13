import type { ClientProfil } from "../types_front";
import { Socket } from "socket.io-client";

/**
 * function listens for a click on the Pong Games history button 
 * @param profile - Clients target profil
 * @param senderSocket - socket from the sender
**/

export function actionBtnPongGames(profile: ClientProfil, senderSocket: Socket) {
		setTimeout(() => {
			const userGames = document.querySelector("#popup-b-hGame");
			userGames?.addEventListener("click", () => {
				window.location.href = `/app/pong/games/${profile.userID}`;
			});
    	}, 0)
};