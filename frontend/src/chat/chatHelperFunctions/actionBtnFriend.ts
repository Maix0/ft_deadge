import type { ClientProfil } from "../types_front";
import { Socket } from "socket.io-client";

/**
 * function listens for a click on the TTT game History button 
 * @param profile - Clients target profil
 * @param senderSocket - socket from the sender
**/

export function actionBtnFriend(profile: ClientProfil, senderSocket: Socket) {
		setTimeout(() => {
			const friend = document.querySelector("#btn-friend");
			friend?.addEventListener("click", () => {

                if (friend.textContent = "friend") {
                    friend.textContent = "not-friend"
                    console.log('friend');
                } 
                else {
                    friend.textContent = "not-friend"
                    console.log('Not a friend');

                } 

            });
    	}, 0)
};