import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Static, Type } from 'typebox';
import { clientChat } from '../app';
import { broadcast } from '../chat_tools';



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

// function broadcast(fastify: FastifyInstance, data: ClientMessage, sender?: string) {
// 	fastify.io.fetchSockets().then((sockets) => {
// 		for (const socket of sockets) {
// 			// Skip sender's own socket
// 			if (socket.id === sender) continue;
// 			// Get client name from map
// 			const clientInfo = clientChat.get(socket.id);
// 			if (!clientInfo?.user) {
// 				console.log(color.yellow, `Skipping socket ${socket.id} (no user found)`);
// 				continue;
// 			}
// 			// Emit structured JSON object
// 			socket.emit('MsgObjectServer', { message: data });
// 			// Debug logs
// 			console.log(color.green, `'Broadcast to:', ${data.command} message: ${data.text}`);
// 		}
// 	});
// }

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


// const route: FastifyPluginAsync = async (fastify): Promise<void> => {
// 	fastify.post('/api/chat/broadcast', {
//     schema: {
//         body: {
//             type: 'object',
//             required: ['nextGame'],
//             properties: {
//                 nextGame: { type: 'string' }
//             }
//         }
//     }
// }, async (req, reply) => {

//     // Body only contains nextGame now
// 		const gameLink: Promise<string> = Promise.resolve(req.body as string );

//     // Broadcast nextGame
// 		if (gameLink)
// 			broadcastNextGame(fastify, gameLink);

//     return reply.send({ status: 'ok' });
// });
// };
// export default route;

