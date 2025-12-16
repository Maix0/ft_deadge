import type { ClientProfil } from './types_front';

export async function openProfilePopup(profil: ClientProfil) {
	const modalname = document.getElementById("modal-name") ?? null;
	if (modalname)
		modalname.innerHTML = 
        `
    		<div class="profile-info">
    			<div-profil-name id="profilName"> Profil of ${profil.user} </div> 
    			<div-login-name id="loginName"> Login Name: '${profil.loginName ?? 'Guest'}' </div> 
    			</br>
    			<div-login-name id="loginName"> Login ID: '${profil.userID ?? ''}' </div> 
    			</br>
    			<button id="popup-b-clear" class="btn-style popup-b-clear">Clear Text</button>
    			<button id="popup-b-invite" class="btn-style popup-b-invite">U Game ?</button>
    			<button id="popup-b-block" class="btn-style popup-b-block">Block User</button>
          			<div id="profile-about">About: '${profil.text}' </div>
    		</div>
    	`;
	const profilList = document.getElementById("profile-modal") ?? null;
	if (profilList)
		profilList.classList.remove("hidden");
	 // The popup now exists → attach the event
}