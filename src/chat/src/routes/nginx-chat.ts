import { FastifyPluginAsync } from 'fastify';
import { MakeStaticResponse, typeResponse } from '@shared/utils';
import { Type } from 'typebox';
import { UserId } from '@shared/database/mixin/user';
import { Server } from 'socket.io';

// colors for console.log
export const color = {
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	reset: '\x1b[0m',
};

// Global map of clients
// key = socket, value = clientname
interface ClientInfo {
  user: string;
  lastSeen: number;
}

const clientChat = new Map<string, ClientInfo>();


export const ChatRes = {
	200: typeResponse('success', 'chat.success', {
		name: Type.String(),
		id: Type.String(),
		guest: Type.Boolean(),
	}),
};

export type ChatResType = MakeStaticResponse<typeof ChatRes>;



const route: FastifyPluginAsync = async (fastify): Promise<void> => {
	fastify.get(
		'/api/chat/test',
		{
			schema: {
				response: ChatRes,
				operationId: 'chatTest',
			},
			config: { requireAuth: true },
		},
		async (req, res) => {

			
			
			let users = fastify.db.getAllUsers();
			console.log("ALL USERS EVER CONNECTED:", users);

			if (!users) return;
			for (const user of users) {
			console.log(color.yellow, "USER:", user.name);
			}
						
			// const usersBlocked = fastify.db.getAllBlockedUsers();
			// console.log(color.red, "ALL BLOCKED USERS:", usersBlocked);
			fastify.db.addBlockedUserFor(users[0].id, users[1].id)
			let usersBlocked2;
			usersBlocked2 = fastify.db.getAllBlockedUsers();
			console.log(color.green, "ALL BLOCKED USERS:", usersBlocked2);
			
			res.makeResponse(200, 'success', 'CCChat.success', { name: 'name', 'id': req.authUser!.id, guest: false });
		},
	);
};
export default route;