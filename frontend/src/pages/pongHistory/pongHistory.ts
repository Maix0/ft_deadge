import { addRoute, navigateTo, setTitle, type RouteHandlerParams, type RouteHandlerReturn } from "@app/routing";
import page from './pongHistory.html?raw';
import { isNullish } from "@app/utils";
import client from "@app/api";
import { updateUser } from "@app/auth";
import { showError } from "@app/toast";


function getHHMM(d: Date): string {
	let h = d.getHours();
	let m = d.getMinutes();
	return `${h < 9 ? '0' : ''}${h}:${m < 9 ? '0' : ''}${m}`
}

async function pongHistory(_url: string, args: RouteHandlerParams): Promise<RouteHandlerReturn> {
	setTitle("Pong Matches");
	if (isNullish(args.userid))
		args.userid = 'me';
	let user = await updateUser();
	if (isNullish(user)) {
		return { html: '<span> You aren\'t logged in </span>', postInsert: () => { showError("You must be logged in !"); navigateTo("/") } };
	}

	let userInfoRes = await client.getUser({ user: args.userid });
	if (userInfoRes.kind !== 'success') {
		return { html: '<span> You tried to open a game history with no data :(</span>', postInsert: () => { showError("We found no data"); navigateTo("/") } };
	}
	let userInfo = userInfoRes.payload;
	let res = await client.pongHistory({ user: args.userid });
	if (res.kind === 'failure' || res.kind === 'notLoggedIn') {
		// todo: make a real page on no data
		return { html: '<span> You tried to open a game history with no data :(</span>', postInsert: () => { showError("We found no data"); navigateTo("/") } };
	}
	let games = res.payload.data;
	games.reverse();

	let gameElement = games.map(g => {
		let rdate = Date.parse(g.date);
		if (Number.isNaN(rdate)) return undefined;
		let date = new Date(rdate);
		const e = document.createElement('div');
		let color = 'bg-amber-200';
		if (!g.local) {
			let youwin = false;

			if (g.left.id === user.id && g.outcome === 'winL')
				youwin = true;
			else if (g.right.id === user.id && g.outcome === 'winR')
				youwin = true;

			if (youwin)
				color = 'bg-green-300';
			else
				color = 'bg-red-300';
		}
		e.className =
			'grid grid-cols-[1fr_auto_1fr] items-center rounded-lg px-4 py-3 ' + color;

		e.innerHTML = `
		<div class="text-right">
			<div class="font-semibold ${g.outcome === 'winL' ? 'text-green-600' : 'text-red-600'}">${g.left.name}</div>
			<div class="text-lg ${g.outcome === 'winL' ? 'text-green-600' : 'text-red-600'}">${g.left.score}</div>
		</div>

		<div class="text-center text-sm text-gray-800 px-4 whitespace-nowrap">${date.toDateString()}<br />${getHHMM(date)}</div>

		<div class="text-left">
			<div class="font-semibold ${g.outcome === 'winR' ? 'text-green-600' : 'text-red-600'}">${g.right.name}</div>
			<div class="text-lg ${g.outcome === 'winR' ? 'text-green-600' : 'text-red-600'}">${g.right.score}</div>
		</div>`;
		return e;
	}).filter(v => !isNullish(v));

	return {
		html: page, postInsert: async (app) => {
			if (!app) return;
			const matchBox = app.querySelector<HTMLDivElement>("#matchList");
			if (!matchBox) return;
			gameElement.forEach(c => matchBox.appendChild(c));
			const userBox = app.querySelector<HTMLDivElement>("#name");
			if (!userBox) return;
			userBox.innerText = userInfo.name;
		}
	};
}

addRoute('/pong/games', pongHistory);
addRoute('/pong/games/:userid', pongHistory);
