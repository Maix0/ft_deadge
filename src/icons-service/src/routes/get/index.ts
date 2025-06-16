import { FastifyPluginAsync } from 'fastify'
import fastifyStatic from '@fastify/static'

const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	fastify.register(fastifyStatic, {
		root: fastify.getDecorator<string>('image_store')!,
		prefix: '/',
	})
	fastify.get('/:userid', async (req, res) => {
		const filename = (req.params as any)['userid'] + '.png';
		await res.sendFile(filename)
	})
}

export default example

