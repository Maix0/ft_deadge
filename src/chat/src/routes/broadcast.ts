import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { MakeStaticResponse, typeResponse } from '@shared/utils';
import { Static, Type } from 'typebox';

import { clientChat } from '../app';

export const color = {
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	reset: '\x1b[0m',
};

export const ChatReq = Type.Object({
	message: Type.String(),
});

export type ChatReq = Static<typeof ChatReq>;

export type ClientMessage = {
	command: string
	destination: string;
	user: string;
	text: string;
	SenderWindowID: string;
};

function broadcast(fastify: FastifyInstance, data: ClientMessage, sender?: string) {
	fastify.io.fetchSockets().then((sockets) => {
		for (const socket of sockets) {
			// Skip sender's own socket
			if (socket.id === sender) continue;
			// Get client name from map
			const clientInfo = clientChat.get(socket.id);
			if (!clientInfo?.user) {
				console.log(color.yellow, `Skipping socket ${socket.id} (no user found)`);
				continue;
			}
			// Emit structured JSON object
			socket.emit('MsgObjectServer', { message: data });
			// Debug logs
			console.log(color.green, `'Broadcast to:', ${data.command} message: ${data.text}`);
		}
	});
}

const route: FastifyPluginAsync = async (fastify): Promise<void> => {
	fastify.post<{ Body: ChatReq }>(
		'/api/chat/broadcast',
		{
			schema: {
				body: ChatReq,
				hide: true,
			},
			config: { requireAuth: false },
		},
		async function(req, res) {
			broadcast(this, { command: '', destination: '', user: 'CMwaLeSever!!', text: req.body.message, SenderWindowID: 'server' });
			void res;
		},
	);
};
export default route;
