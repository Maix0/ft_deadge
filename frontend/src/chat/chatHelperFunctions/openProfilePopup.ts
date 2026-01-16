import type { ClientProfil } from '../types_front';

export async function openProfilePopup(profil: ClientProfil) {
	const modalname = document.getElementById("modal-name") ?? null;
	if (modalname)
		modalname.innerHTML = 
        `
    		<div class="profile-info">
    			<div-profil-name id="profilName" class="text-xl font-bold text-blue-500"> Profile of ${profil.user} </div>
    			<div-login-name id="loginName"> Login status: <span class="recessed">${profil.loginName ?? 'Guest'}</span> </div> 
    			</br>
    			<div-login-name id="loginName"> Login ID: <span class="recessed">${profil.userID ?? ''}</span> </div> 
    			</br>
    			<button id="popup-b-invite" class="btn-style popup-b-invite">U Game ?</button>
    			<button id="popup-b-block" class="btn-style popup-b-block">Block User</button>
				<div id="profile-about" class="text-2xl">About: <span class="recessed">${profil.text}</span> </div>
				<button id="popup-b-hGame" class="btn-style-games popup-b-game">View Pong Games</button>
				<button id="popup-b-hTGame" class="btn-style-games popup-b-TTTgame">View TTT Games</button>
				<button id="btn-friend" class="btn-style popup-b-friend">friend</button>
    		</div>
    	`;
	const profilList = document.getElementById("profile-modal") ?? null;
	if (profilList)
		profilList.classList.remove("hidden");
}
