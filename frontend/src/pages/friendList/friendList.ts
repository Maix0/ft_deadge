import { addRoute, navigateTo, setTitle, type RouteHandlerParams, type RouteHandlerReturn } from "@app/routing";
import page from './friendList.html?raw';
import { getFriendList, isNullish, updateFriendsList } from "@app/utils";
import client from "@app/api";
import { updateUser } from "@app/auth";
import { showError } from "@app/toast";


async function friends(_url: string, args: RouteHandlerParams): Promise<RouteHandlerReturn> {
	setTitle("Tic Tac Toe Games");
	let user = await updateUser();
	if (isNullish(user)) {
		return { html: '<span> You aren\'t logged in </span>', postInsert: () => { showError("You must be logged in !"); navigateTo("/") } };
	}
	await updateFriendsList();
	let friendList = getFriendList();
	friendList.sort();

	let friendsElem = friendList.map(g => {
		let e = document.createElement('div');
		e.className = 'grid grid-cols-[1fr_auto_1fr] items-center bg-zinc-800 rounded-lg px-4 py-3';

		e.innerHTML = `
		<div class="text-center font-semibold text-white">${g.name}</div>
		<a href="/ttt/games/${g.id}" class="text-center">TTT Games</a>
		<a href="/pong/games/${g.id}" class="text-center">Pong Games</a>
		`;
		return e;
	}).filter(v => !isNullish(v));

	return {
		html: page, postInsert: async (app) => {
			if (!app) return;
			const friendsBox = app.querySelector<HTMLDivElement>("#friendList");
			if (!friendsBox) return;
			friendsElem.forEach(c => friendsBox.appendChild(c));
		}
	};
}

addRoute('/friends', friends);
