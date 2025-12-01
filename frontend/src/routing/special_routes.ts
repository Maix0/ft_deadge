import { escapeHTML } from "@app/utils";
import { getRoute, type RouteHandlerParams } from "@app/routing";

export async function route_404(url: string, _args: RouteHandlerParams): Promise<string> {
	return `
		<div> 404 - Not Found </div>
		<hr />
		<center> ${escapeHTML(url)} </center>
	`
}
