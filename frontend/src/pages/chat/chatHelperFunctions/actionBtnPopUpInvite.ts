import type { ClientProfil } from "../types_front";
import { Socket } from "socket.io-client";
import { inviteToPlayPong } from "./inviteToPlayPong";

/**
 * function listens for a click on the U-Game button and activates a popup function
 * inviteToPlayPong
 * @param invite - Clients target profil
 * @param senderSocket - socket from the sender
**/

export function actionBtnPopUpInvite(invite: ClientProfil, senderSocket: Socket) {
		setTimeout(() => {
			const InvitePongBtn = document.querySelector("#popup-b-invite");
			InvitePongBtn?.addEventListener("click", () => {
				inviteToPlayPong(invite, senderSocket);
			});
    	}, 0)
};