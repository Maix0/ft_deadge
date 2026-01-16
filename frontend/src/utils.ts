import client from "./api";

export function escapeHTML(str: string): string {
	const p = document.createElement("p");
	p.appendChild(document.createTextNode(str));
	return p.innerHTML;
}
export function isNullish<T>(v: T | undefined | null): v is null | undefined {
	return v === null || v === undefined;
}

// MAKE SURE YOU DO WANT TO CALL THIS FUNCTION
export function ensureWindowState() {
	window.__state = window.__state ?? {};
}

export async function updateFriendsList() {
	window.__state = window.__state ?? {};
	window.__state.friendList ??= [];

	try {
		let req = await client.listFriend();
		if (req.kind === "success") {
			window.__state.friendList = req.payload.friends;
		}
	} catch (e: unknown) { }
}

export function getFriendList() {
	ensureWindowState();
	window.__state.friendList ??= [];

	return window.__state.friendList;
}
