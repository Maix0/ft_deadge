import { addRoute, setTitle } from "@app/routing";
import page from './about.html?raw'


async function route(_url: string, _args: { [k: string]: string }): Promise<string> {
	setTitle('About us')
	return page;
}



addRoute('/', route)
