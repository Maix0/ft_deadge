/**
/* EXPERIMENTAL: how to send a starting game link to chat
**/
export async function sendGameLinkToChatService(link: string) :Promise<string> {
	const payload = { link };
	return JSON.stringify(payload);
}