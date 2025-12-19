import { FastifyPluginAsync } from 'fastify';
import { Static, Type } from 'typebox';

export const ChatReq = Type.Object({
	message: Type.String(),
});

export type ChatReq = Static<typeof ChatReq>;

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
			// broadcast(this, { command: '', destination: '', user: 'CMwaLeSever!!', text: req.body.message, SenderWindowID: 'server' });
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

