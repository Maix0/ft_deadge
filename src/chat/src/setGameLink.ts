export function setGameLink(link: string): string {
	if (!link) {
		link = '<a href=\'https://google.com\' style=\'color: blue; text-decoration: underline; cursor: pointer;\'>Click me</a>';
	}
	return link;
};