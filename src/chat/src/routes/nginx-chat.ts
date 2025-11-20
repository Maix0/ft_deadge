import { FastifyPluginAsync } from 'fastify';
import { MakeStaticResponse, typeResponse } from '@shared/utils';
import { Type } from '@sinclair/typebox';
// import * as fsocketio from 'socket.io';




export const ChatRes = {
	200: typeResponse('success', 'chat.success', {
		name: Type.String(),
		id: Type.String(),
		guest: Type.Boolean(),
	}),
};

export type ChatResType = MakeStaticResponse<typeof ChatRes>;

const route: FastifyPluginAsync = async (fastify): Promise<void> => {
	
	// fastify.get(
	// 	'/api/chat/test',
	// 	{
	// 		schema: {
	// 			response: ChatRes,
	// 			operationId: 'chatTest',
	// 		},
	// 		config: { requireAuth: true },
	// 	},
	// 	async (req, res) => {
	// 		console.log('/api/chat called =================>');
	// 		res.makeResponse(200, 'success', 'chat.success', { name: req.authUser!.name, 'id': req.authUser!.id, guest: false });
	// 	},
	// );
};
export default route;