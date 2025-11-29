import { updateUser } from '@app/auth';
import { route_404 } from './special_routes'


// ---- Router logic ----
export function navigateTo(url: string) {
	if (url.startsWith('/') && !url.startsWith('/app'))
		url = `/app${url}`;
	history.pushState(null, "", url);
	handleRoute();
}

type AsyncFunctionMaker<F extends (...args: any[]) => any> =
	(...args: Parameters<F>) => Promise<ReturnType<F>>;

export type RouteHandlerParams = { [k: string]: string };


export type SyncRouteHandlerPostInsertFn = (appNode?: HTMLElement) => void;
export type AsyncRouteHandlerPostInsertFn = AsyncFunctionMaker<SyncRouteHandlerPostInsertFn>;
export type RouteHandlerReturn = {
	html: string,
	postInsert?: SyncRouteHandlerPostInsertFn | AsyncRouteHandlerPostInsertFn,
};

export type SyncRouteHandler = (url: string, args: RouteHandlerParams) => RouteHandlerReturn | string;
export type AsyncRouteHandler = AsyncFunctionMaker<SyncRouteHandler>;
export type RouteHandler = string | SyncRouteHandler | AsyncRouteHandler;
export type Routes = Map<string, RouteHandlerData>
export type RouteHandlerSpecialArgs = {
	bypass_auth: boolean,
};

export class RouteHandlerData {
	public readonly handler: RouteHandler;
	public readonly url: string;
	public readonly parts: (string | null)[];
	public readonly args: (string | null)[];
	public readonly orignal_url: string;
	public readonly special_args: RouteHandlerSpecialArgs;

	public static SPECIAL_ARGS_DEFAULT: RouteHandlerSpecialArgs = {
		bypass_auth: false,
	}

	constructor(url: string, handler: RouteHandler, special_args: Partial<RouteHandlerSpecialArgs>) {
		this.special_args = Object.assign({}, RouteHandlerData.SPECIAL_ARGS_DEFAULT);
		Object.assign(this.special_args, special_args);
		console.log(url, this.special_args);

		let parsed = RouteHandlerData.parseUrl(url);
		this.handler = handler;
		this.parts = parsed.parts;
		this.url = parsed.parts.map((v, i) => v ?? `:${i}`).reduce((p, c) => `${p}/${c}`, '');
		this.args = parsed.args;
		this.orignal_url = parsed.original;
	}

	private static parseUrl(url: string): { parts: (string | null)[], original: string, args: (string | null)[] } {
		const deduped = url.replace(RegExp('/+'), '/');
		const trimed = deduped.replace(RegExp('(^/)|(/$)'), '');

		let parts = trimed.split('/');
		let s = parts.map((part, idx) => {
			// then this is a parameter !
			if (part.startsWith(':')) {
				let param_name = part.substring(1) // remove the :
				// verifiy that the parameter name only contains character, underscores and numbers (not in fist char tho)
				if (!param_name.match('^[a-zA-Z_][a-zA-Z_0-9]*$'))
					throw `route parameter ${idx} for url '${url}' contains illegal character`;
				return { idx, param_name, part: null }
			}
			else {
				return { idx, param_name: null, part };
			}
		})
		{
			let dup = new Set();
			for (const { param_name } of s) {
				if (param_name === null) continue;
				if (dup.has(param_name))
					throw `route paramater '${param_name}' is a duplicate in route ${url}`;
				dup.add(param_name);
			}
		}
		let out_args = s.map(p => p.param_name);
		let out_parts = s.map(p => p.part);

		return {
			parts: out_parts, args: out_args, original: url,
		}
	}
}

function urlToParts(url: string): string[] {
	const deduped = url.replace(RegExp('/+'), '/');
	const trimed = deduped.replace(RegExp('(^/)|(/$)'), '');

	let parts = trimed.split('/');
	if (parts.at(0) === 'app')
		parts.shift();
	return parts;
}

function setupRoutes(): [
	() => Routes,
	(url: string, handler: RouteHandler, args?: Partial<RouteHandlerSpecialArgs>) => void
] {
	const routes = new Map();

	return [
		() => routes,
		(url: string, handler: RouteHandler | string, args?: Partial<RouteHandlerSpecialArgs>) => {
			let d = new RouteHandlerData(url, handler, args ?? {});
			if (routes.has(d.url))
				throw `Tried to insert route ${url}, but it already exists`;
			routes.set(d.url, d);
		}
	];
}

function setupTitle(): [
	() => string,
	(title: string) => void,
] {
	let title = "";
	let titleElem = document.querySelector<HTMLDivElement>('#header-title')!;
	return [
		() => title,
		(new_title) => {
			title = new_title;
			titleElem.innerText = title;
		}
	]
}


export const [getRoute, addRoute] = setupRoutes();

export const [getTitle, setTitle] = setupTitle();

(window as any).getRoute = getRoute;

const executeRouteHandler = async (handler: RouteHandlerData, ...args: Parameters<SyncRouteHandler>): Promise<RouteHandlerReturn> => {
	// handler may be a raw string literal, if yes => return it directly
	if (typeof handler.handler === 'string')
		return { html: handler.handler };

	// now we know handler is a function. what does it return ? we don't know
	// the two choices are either a string, or a Promise<string> (needing an await to get the string)
	const result = handler.handler(...args);


	// if `result` is a promise, awaits it, otherwise do nothing
	let ret = result instanceof Promise ? (await result) : result;

	// if ret is a string, then no postInsert function exists => return a well formed object
	if (typeof ret === 'string')
		return { html: ret };
	return ret;
}

const route_404_handler = new RouteHandlerData('<special:404>', route_404, { bypass_auth: true });

function parts_match(route_parts: (string | null)[], parts: string[]): boolean {
	if (route_parts.length !== parts.length) return false;

	let zipped = route_parts.map((v, i) => [v ?? parts[i], parts[i]]);
	return zipped.every(([lhs, rhs]) => lhs == rhs)
}

export async function handleRoute() {
	let routes = getRoute();

	let parts = urlToParts(window.location.pathname);
	let routes_all = routes.entries();

	let route_handler: RouteHandlerData = route_404_handler;
	let args: RouteHandlerParams = {};
	for (const [_, route_data] of routes_all) {
		if (!parts_match(route_data.parts, parts)) continue;

		args = {};
		route_data.args.forEach((v, i) => {
			if (v === null) return;
			args[v] = decodeURIComponent(parts[i]);
		})
		route_handler = route_data;
		break;
	}

	let user = await updateUser();
	console.log(route_handler);
	console.log(user, !route_handler.special_args.bypass_auth, user === null && !route_handler.special_args.bypass_auth);
	if (user === null && !route_handler.special_args.bypass_auth)
		return navigateTo(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`)
	const app = document.getElementById('app')!;
	document.dispatchEvent(new CustomEvent('ft:pageChange' as any, {} as any) as any);
	let ret = await executeRouteHandler(route_handler, window.location.pathname, args)
	app.innerHTML = ret.html;
	if (ret.postInsert) {
		let r = ret.postInsert(app);
		if (r instanceof Promise) await r;
	}
}


// ---- Intercept link clicks ----
document.addEventListener('click', e => {
	const target = e?.target;
	if (!target) return;
	if (!(target instanceof Element)) return;
	let link = target.closest('a[href]') as HTMLAnchorElement;
	if (!link) return;

	const url = new URL(link.href);
	const sameOrigin = url.origin === window.location.origin;

	if (sameOrigin) {
		e.preventDefault();
		navigateTo(url.pathname);
	}
});

// ---- Handle browser navigation (back/forward) ----
window.addEventListener('popstate', handleRoute);

Object.assign((window as any), { getTitle, setTitle, getRoute, addRoute, navigateTo })
