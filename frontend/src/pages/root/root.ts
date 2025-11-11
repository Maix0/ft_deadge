import { addRoute, setTitle, type RouteHandlerParams } from "@app/routing";
import page from './root.html?raw'

addRoute('/', (_: string) => {
	setTitle('ft boules')
	return page;
})


addRoute('/with_title/:title', (_: string, args: RouteHandlerParams) => {
	setTitle(args.title)
	console.log(`title should be '${args.title}'`);
	return page;
})
