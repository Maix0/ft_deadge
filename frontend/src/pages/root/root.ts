import { addRoute, setTitle } from "@app/routing";
import page from "./root.html?raw";

addRoute(
	"/",
	async (_: string): Promise<string> => {
		setTitle(`Welcome`);
		return page;
	},
	{ bypass_auth: true },
);
