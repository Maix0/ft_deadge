import { FastifyPluginAsync } from 'fastify';
import { Static, Type } from 'typebox';
import { broadcast } from '../broadcast';



export const PongReq = Type.Object({
	message: Type.String(),
});

export type PongReq = Static<typeof PongReq>;


const route: FastifyPluginAsync = async (fastify): Promise<void> => {
	fastify.post<{ Body: PongReq }>(
		'/api/pong/broadcast',
		{
			schema: {
				body: PongReq,
				hide: true,
			},
			config: { requireAuth: false },
		},
		async function(req, res) {
			broadcast(this, { command: '', destination: 'system-info', user: 'CMwaLeSever!!', text: req.body.message, SenderWindowID: 'server' });
			void res;
		},
	);
};
export default route;

/**
 * 
 *  try this in a terminal
 * 
 *  curl -k --data-raw '{"message": "Message SENT from the terminal en REMOTE"}' 'https://local.maix.me:8888/api/pong/broadcast' -H "Content-Type: application/json"
 * 
 *  send message info to the fronatend via the route '/api/pong/broadcast' 
 */




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

