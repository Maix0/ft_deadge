import { FastifyPluginAsync } from 'fastify';
import { Static, Type } from 'typebox';
import { broadcastNextGame } from '../broadcastNextGame';

export const ChatReq = Type.Object({
	nextGame: Type.String(),
});

export type ChatReq = Static<typeof ChatReq>;

const route: FastifyPluginAsync = async (fastify): Promise<void> => {
	fastify.post<{ Body: ChatReq }>('/broadcastNextGame', {
		schema: {
			body: ChatReq,
			hide: true,
		},
	}, async function(req, reply) {
		this.log.info({ msg: 'Broadcasting nextGame status', ...req.body });
		broadcastNextGame(fastify, req.body.nextGame);
		return reply.send({ status: 'ok' });
	});
};
export default route;

