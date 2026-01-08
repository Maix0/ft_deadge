export type ClientMessage = {
	command: string
	destination: string;
	type: string,
	user?: string;
	userID?: string,
	token?: string
	frontendUserName?: string,
	frontendUser?: string,
	text?: string;
	SenderWindowID?: string,
	SenderUserName?: string,
	SenderUserID?: string,
	timestamp?: number,
	Sendertext?: string,
	innerHtml?: string,
};


export type ClientProfil = {
	command: string,
	destination: string,
   	type: string,
	user: string,
	loginName?: string,
	userID?: string,
	text?: string,
	timestamp?: number,
	SenderWindowID?:string,
	SenderName?: string,
	SenderID?: string,
    Sendertext?: string,
    innerHtml?: string,
	guestmsg?: boolean,

};


// export type obj =
// {
// 	command: string,
// 	destination: string,
// 	type: string,
// 	user: string,
// 	frontendUserName: string,
// 	frontendUser: string,
// 	token: string,
// 	text: string,
// 	timestamp: number,
// 	SenderWindowID: string,
// 	Sendertext: string,
// };

export type BlockRelation = {
	blocked: string;
	blocker: string;
};