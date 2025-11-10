import { addRoute, type RouteHandlerParams } from "@app/routing";

addRoute('/chat', function (_url: string, _args: RouteHandlerParams) {
	return "this is the chat page !"
})
