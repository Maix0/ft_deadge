import { Socket } from 'socket.io-client';
import type { ClientProfil } from '../types_front';
import { blockUser } from './blockUser';

export function actionBtnPopUpBlock(block: ClientProfil, senderSocket: Socket) {
		setTimeout(() => {
			const blockUserBtn = document.querySelector("#popup-b-block");
			blockUserBtn?.addEventListener("click", () => {
				block.text = '';
				blockUser(block, senderSocket);
			});
    	}, 0)
};