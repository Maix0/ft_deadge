import { clearChatWindow } from './clearChatWindow';
import { Socket } from 'socket.io-client';
import type { ClientProfil } from './types_front';


export function actionBtnPopUpClear(profil: ClientProfil, senderSocket: Socket) {
		setTimeout(() => {
			const clearTextBtn = document.querySelector("#popup-b-clear");        		
			clearTextBtn?.addEventListener("click", () => {
				clearChatWindow(senderSocket);
			});
    	}, 0)
};