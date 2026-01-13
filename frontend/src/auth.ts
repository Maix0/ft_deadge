import { showError } from "@app/toast";
import client from "@app/api";
import cookie from "js-cookie";
import { ensureWindowState, isNullish } from "@app/utils";
import { handleRoute, navigateTo } from "./routing";


cookie.remove("pkce");
const headerProfile =
	document.querySelector<HTMLDivElement>("#header-profile")!;

ensureWindowState();
window.__state.user ??= null;

export type User = {
	id: string;
	guest: boolean;
	name: string;
	desc: string;
	selfInfo?: {
		loginName?: string;
		providerId?: string;
		providerUser?: string;
	};
};

declare module "ft_state" {
	interface State {
		user: User | null;
		_headerProfile: boolean;
		_reloadOnAuthChange: boolean;
	}
}

export function getUser(): Readonly<User> | null {
	return window.__state.user;
}

export function isLogged(): boolean {
	return window.__state.user !== null;
}

export function setUser(newUser: User | null) {
	let sendEvent = (window.__state.user?.id !== newUser?.id);
	window.__state.user = newUser;
	updateHeaderProfile();

	if (sendEvent) {
		const event = new CustomEvent("ft:userChange", { detail: isNullish(newUser) ? null : { id: newUser.id, name: newUser.name } });
		document.dispatchEvent(event);
	}
}

export function updateHeaderProfile() {
	if (window.__state.user !== null) {
		headerProfile.innerText = window.__state.user.name;
	} else {
		headerProfile.innerText = "Login";
	}
}

export async function updateUser(): Promise<Readonly<User> | null> {
	try {
		let res = await client.getUser({ user: "me" });

		if (res.kind === "success") {
			setUser(res.payload);
			return res.payload;
		} else if (res.kind === "failure") {
			// well no user :D
			setUser(null);
			return null;
		} else if (res.kind === "notLoggedIn") {
			setUser(null);
			return null;
		} else {
			setUser(null);
			showError(`unknown response: ${JSON.stringify(res)}`);
			return null;
		}
	} catch (e) {
		setUser(null);
		showError(`failed to get user: ${e}`);
		return null;
	}
}

window.__state._headerProfile ??= false;
if (!window.__state._headerProfile) {
	headerProfile.addEventListener("click", () => {
		if (window.__state.user === null) {
			navigateTo(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
		} else {
			navigateTo("/profile");
		}
	});
	window.__state._headerProfile = true;
}

window.__state._reloadOnAuthChange ??= false;
if (!window.__state._reloadOnAuthChange) {
	document.addEventListener("ft:userChange", () => handleRoute());
	window.__state._reloadOnAuthChange = true;
}
updateHeaderProfile();

Object.assign(window as any, { getUser, setUser, updateUser, isLogged });
