export type ClientMessage = {
	command: string
	destination: string;
	user: string;
	text: string;
	SenderWindowID: string;
};

export type ClientProfil = {
	command: string,
	destination: string,
	type: string,
	user: string,
	loginName: string,
	userID: string,
	text: string,
	timestamp: number,
	SenderWindowID: string,
	SenderName: string,
	Sendertext: string,
	innerHtml?: string,

};
