import client from "@app/api";
import type { ClientProfil } from "../types_front";
import { Socket } from "socket.io-client";
import { showError, showSuccess } from "@app/toast";
import { getFriendList, updateFriendsList } from "@app/utils";

/**
 * function listens for a click on the TTT game History button 
 * @param profile - Clients target profil
 * @param senderSocket - socket from the sender
**/

export function actionBtnFriend(profile: ClientProfil, senderSocket: Socket) {
	setTimeout(() => {
		const friend = document.querySelector("#btn-friend");
		friend?.addEventListener("click", async () => {
			let friendList = getFriendList();
			if (!friendList.some(v => v.id === profile.userID!)) {
				let req = await client.addFriend({ user: profile.userID! });
				if (req.kind === 'success')
					showSuccess('Successfully added a new Friend')
				else
					showError('Failed to add a new Friend');
			}
			else {
				let req = await client.removeFriend({ user: profile.userID! });
				if (req.kind === 'success')
					showSuccess('Successfully removed a Friend')
				else
					showError('Failed to remove a Friend');
			}
			await updateFriendsList();
		});
	}, 0)
};
