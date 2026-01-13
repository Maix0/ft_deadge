import type { ClientProfil } from "../types_front";
import { Socket } from "socket.io-client";

/**
 * function listens for a click on the TTT game History button 
 * @param profile - Clients target profil
 * @param senderSocket - socket from the sender
**/

export function actionBtnTTTGames(profile: ClientProfil, senderSocket: Socket) {
		setTimeout(() => {
			const userGames = document.querySelector("#popup-b-hTGame");
			userGames?.addEventListener("click", () => {
				window.location.href = `/app/ttt/games/${profile.userID}`;
			});
    	}, 0)
};