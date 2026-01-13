import { addRoute, navigateTo, type RouteHandlerParams, type RouteHandlerReturn } from "@app/routing";
import pageAll from './tourHistoryAll.html?raw';
import pageSingle from './tourHistorySingle.html?raw';
import { isNullish } from "@app/utils";
import client from "@app/api";
import { showError, showInfo } from "@app/toast";
import { getUser } from "@app/auth";


function getHHMM(d: Date): string {
	let h = d.getHours();
	let m = d.getMinutes();
	return `${h < 9 ? '0' : ''}${h}:${m < 9 ? '0' : ''}${m}`
}

async function tourHistoryAll(_url: string, args: RouteHandlerParams): Promise<RouteHandlerReturn> {

	let data = await client.tournamentList();
	if (data.kind !== 'success') {
		showError(`Failed to fetch data`);
		return {
			html: "", postInsert: async () => navigateTo('/')
		}
	}
	return {
		html: pageAll, postInsert: async (app) => {
			const tourDiv = app?.querySelector('#tourList');
			if (!tourDiv || !app)
				return showError('Fatal Error');
			let childrens = await Promise.all(data.payload.data.map(async (tour) => {
				const ownerUser = await client.getUser({ user: tour.owner });
				const ownerUserName = ownerUser.kind === 'success' ? ownerUser.payload.name : "User Not Found";
				return {
					...tour,
					ownerName: ownerUserName,
				}
			}))
			childrens.sort((l, r) => ((new Date(r.time).getTime()) - (new Date(l.time)).getTime()));

			childrens.map(tour => {
				let time = new Date(tour.time);
				let owner = { id: tour.owner, name: tour.ownerName };
				let id = tour.id;
				let playerCount = tour.playerCount;

				const eventItem = document.createElement('div');
				eventItem.classList.add(
					'bg-white',
					'p-4',
					'rounded-lg',
					'shadow-md',
					'mb-4',
					'flex',
					'justify-between',
					'items-center',
				);

				eventItem.innerHTML = `
				<div class="text-left">
					<p class="text-lg font-semibold text-gray-700"><strong>Time:</strong> ${time.toDateString()} ${getHHMM(time)}</p>
					<p class="text-sm text-gray-500"><strong>Created By:</strong> ${owner.name} </p>
					<p class="text-sm text-gray-500"><strong>Player Count:</strong> ${playerCount}</p>
				</div>
				<button class="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600" onclick="navigateTo('/tour/${id}')">View</button>`;
				return eventItem;
			}).forEach(v => tourDiv.appendChild(v));

		}
	};
}

async function tourHistorySingle(_url: string, args: RouteHandlerParams): Promise<RouteHandlerReturn> {
	if (isNullish(args.tourid)) {
		showError(`No Tournament Specified`);
		return {
			html: "", postInsert: async () => navigateTo('/tour')
		}
	}

	let data = await client.tournamentData({ id: args.tourid });
	if (data.kind !== 'success') {
		showError(`Failed to fetch data`);
		return {
			html: "", postInsert: async () => navigateTo('/')
		}
	}

	let d = data.payload.data;
	let user = getUser();
	if (user === null) {
		showError(`You must be logged in`);
		return {
			html: "", postInsert: async () => navigateTo('/')
		}
	}

	return {
		html: pageSingle, postInsert: async (app) => {
			const tourOwner = app?.querySelector<HTMLSpanElement>('#tourOwner');
			const tourTime = app?.querySelector<HTMLSpanElement>('#tourTime');
			const tourCount = app?.querySelector<HTMLSpanElement>('#tourCount');
			const tourPlayerList = app?.querySelector<HTMLTableElement>('#tourPlayerList');
			const tourGames = app?.querySelector<HTMLDivElement>('#tourGames');
			if (!tourOwner || !tourTime || !tourCount || !tourPlayerList || !tourGames || !app)
				return showError('Fatal Error');


			d.users.sort((l, r) => r.score - l.score);
			let time = new Date(d.time);

			const medals = ["🥇", "🥈", "🥉"];
			tourPlayerList.innerHTML = d.users.map((player, idx) =>
				`<tr class="${player.id === user.id ? "bg-amber-400 hover:bg-amber-500" : "hover:bg-gray-50"}" key="${player.id}">
				<td class="px-4 py-2 text-sm text-gray-800 text-center border-b font-semibold min-w-100px">${idx < medals.length ? `<span class="font-lg">${medals[idx]}</span>` : ''}${player.nickname}</td>
				<td class="px-4 py-2 text-sm text-gray-800 text-center border-b font-bold  min-w-100px">${player.score}</td></tr>`)
				.join("");

			tourOwner.innerText = await (async () => {
				let req = await client.getUser({ user: d.owner });
				if (req.kind === 'success')
					return req.payload.name;
				return 'Unknown User';
			})();
			tourCount.innerText = d.playerCount.toString();
			tourTime.innerText = `${time.toDateString()} ${getHHMM(time)}`;

			let gameElement = d.games.map(g => {
				let rdate = Date.parse(g.date);
				if (Number.isNaN(rdate)) return undefined;
				let date = new Date(rdate);
				const e = document.createElement('div');
				let color = 'bg-slate-300';
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
			gameElement.forEach(e => tourGames.appendChild(e));
		}
	}
}

addRoute('/tour', tourHistoryAll);
addRoute('/tour/:tourid', tourHistorySingle);
