export type ClientMessage = {
	command: string
	destination: string;
	type: string,
	user: string;
	userID: string,
	token: string
	frontendUserName: string,
	frontendUser: string,
	text: string;
	SenderWindowID: string,
	SenderUserName: string,
	SenderUserID: string,
	timestamp: number,
	Sendertext: string,
	innerHtml?: string,
};


export type ClientProfil = ClientProfilPartial & {
	loginName?: string,
	SenderName?: string,
	Sendertext?: string,
    innerHtml?: string,
}; 	


export type ClientProfilPartial = {
	command: string,
	type: string,
	destination: string,
	user: string, 
	userID: string,
	timestamp: number,
	SenderWindowID?:string,
	SenderID?: string,
	text?: string,
	token?: string
	guestmsg?: boolean,
}



export type blockedUnBlocked = 
{
	userState: string,
	userTarget: string,
	by: string,
};

export type obj =
{
	command: string,
	destination: string,
	type: string,
	user: string,
	frontendUserName: string,
	frontendUser: string,
	token: string,
	text: string,
	timestamp: number,
	SenderWindowID: string,
	Sendertext: string,
};
