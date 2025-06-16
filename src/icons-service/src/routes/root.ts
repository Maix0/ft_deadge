import { FastifyPluginAsync } from 'fastify'


const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	fastify.get('*', async (req, res) => res.code(403))
}

export default example
