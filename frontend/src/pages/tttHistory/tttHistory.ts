import { addRoute, navigateTo, setTitle, type RouteHandlerParams, type RouteHandlerReturn } from "@app/routing";
import page from './tttHistory.html?raw';
import { isNullish } from "@app/utils";
import client from "@app/api";
import { updateUser } from "@app/auth";
import { showError } from "@app/toast";


function getHHMM(d: Date): string {
	let h = d.getHours();
	let m = d.getMinutes();
	return `${h < 9 ? '0' : ''}${h}:${m < 9 ? '0' : ''}${m}`
}

function statusText(side: 'X' | 'O', status: string): string {
	if (status === `win${side}`) return 'WIN';
	if (status === `win${side === 'X' ? 'O' : 'X'}`) return 'LOSE';
	return 'DRAW'
}

function statusColor(side: 'X' | 'O', status: string): string {
	if (status === `win${side}`) return 'text-green-600';
	if (status === `win${side === 'X' ? 'O' : 'X'}`) return 'text-red-600';
	return 'text-yellow-600'
}

async function tttHistory(_url: string, args: RouteHandlerParams): Promise<RouteHandlerReturn> {
	setTitle("Tic Tac Toe Games");
	if (isNullish(args.userid))
		args.userid = 'me';
	let user = await updateUser();
	if (isNullish(user)) {
		return { html: '<span> You aren\'t logged in </span>', postInsert: () => { showError("You must be logged in !"); navigateTo("/") } };
	}
	let targetUserId = args.userid !== 'me' ? args.userid : user.id;

	let userInfoRes = await client.getUser({ user: args.userid });
	if (userInfoRes.kind !== 'success') {
		return { html: '<span> You tried to open a game history with no data :(</span>', postInsert: () => { showError("We found no data"); navigateTo("/") } };
	}
	let userInfo = userInfoRes.payload;
	let res = await client.tttHistory({ user: args.userid });
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
		// maybe we do want local games ? then put the check here :D
		// if (!g.local) {
		if (true) {
			let state: 'win' | 'lose' | 'draw' = 'lose';

			if (g.outcome === 'draw')
				state = 'draw';
			else if (g.playerX.id === targetUserId && g.outcome === 'winX')
				state = 'win';
			else if (g.playerO.id === targetUserId && g.outcome === 'winO')
				state = 'win';

			if (state === 'win')
				color = 'bg-green-300';
			else if (state === 'lose')
				color = 'bg-red-300';
			else
				color = 'bg-amber-200';
		}
		e.className =
			'grid grid-cols-[1fr_auto_1fr] items-center rounded-lg px-4 py-3 ' + color;

		e.innerHTML = `
		<div class="text-right">
			<div class="font-semibold ${statusColor('X', g.outcome)}">${g.playerX.name}</div>
			<div class="text-lg ${statusColor('X', g.outcome)}">${statusText('X', g.outcome)}</div>
		</div>

		<div class="text-center text-sm text-gray-800 px-4 whitespace-nowrap">${date.toDateString()}<br />${getHHMM(date)}</div>

		<div class="text-left">
			<div class="font-semibold ${statusColor('O', g.outcome)}">${g.playerO.name}</div>
			<div class="text-lg ${statusColor('O', g.outcome)}">${statusText('O', g.outcome)}</div>
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

addRoute('/ttt/games', tttHistory);
addRoute('/ttt/games/:userid', tttHistory);
