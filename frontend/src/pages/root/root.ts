import { addRoute, setTitle, type RouteHandlerParams } from "@app/routing";
import page from './root.html?raw'
import { updateUser } from "@app/auth";

addRoute('/', async (_: string): Promise<string> => {
	let user = await updateUser();
	if (user === null)
		setTitle(`Welcome`)
	else
		setTitle(`Welcome ${user.guest ? '[GUEST] ' : ''}${user.name}`);
	return page;
}, { bypass_auth: true })


addRoute('/with_title/:title', (_: string, args: RouteHandlerParams) => {
	setTitle(args.title)
	console.log(`title should be '${args.title}'`);
	return page;
}, { bypass_auth: false })
