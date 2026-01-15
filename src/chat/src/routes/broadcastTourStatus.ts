import { FastifyPluginAsync } from 'fastify';
import { Static, Type } from 'typebox';
import { broadcastTourStatus } from '../broadcastTourStatus';

export const ChatReq = Type.Object({
	message: Type.String(),
});

export type ChatReq = Static<typeof ChatReq>;

const route: FastifyPluginAsync = async (fastify): Promise<void> => {
	fastify.post<{ Body: ChatReq }>('/broadcastTourStatus', {
		schema: {
			body: ChatReq,
			hide: true,
		},
	}, async function(req, reply) {
		const gameLink: string = req.body.message;
		if (gameLink) {
			broadcastTourStatus(fastify, gameLink);
		}
		return reply.send({ status: 'ok' });
	});
};
export default route;

