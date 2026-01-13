import { navigateTo } from "@app/routing";
import type { ClientProfil } from "../types_front";
import { Socket } from "socket.io-client";
import { quitChat } from "./quitChat";

/**
 * function listens for a click on the Pong Games history button 
 * @param profile - Clients target profil
 * @param senderSocket - socket from the sender
**/

export function actionBtnPongGames(profile: ClientProfil, senderSocket: Socket) {
		setTimeout(() => {
			const userGames = document.querySelector("#popup-b-hGame");
			userGames?.addEventListener("click", () => {
				navigateTo(`/app/pong/games/${profile.userID}`);
				quitChat();
			});
    	}, 0)
};