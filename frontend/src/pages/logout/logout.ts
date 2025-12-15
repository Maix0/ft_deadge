import { addRoute, navigateTo, setTitle, type RouteHandlerReturn } from "@app/routing";
import cookie from "js-cookie";

async function route(_url: string, _args: { [k: string]: string }): Promise<RouteHandlerReturn> {
	setTitle('Logout')
	return {
		html: "you should have been logged out", postInsert: async (app) => {
			cookie.remove("token");
			navigateTo("/");
		}
	};
}



addRoute('/logout', route, { bypass_auth: true })
