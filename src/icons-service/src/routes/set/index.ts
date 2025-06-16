import { FastifyPluginAsync } from 'fastify'
import { join } from 'node:path'
import { open } from 'node:fs/promises'
import fastifyRawBody from 'fastify-raw-body'

const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	// fastify.register(DeadgeInternalApi, {})
	await fastify.register(fastifyRawBody, { encoding: false });
	fastify.post('/:userid', { config: { rawBody: true, encoding: false } }, async function(request, reply) {
		const userid: string | undefined = (request.params as any)['userid'];
		if (userid === undefined) {
			return await reply.code(403);
		}
		const image_store: string = fastify.getDecorator('image_store')
		const image_path = join(image_store, userid + ".png")
		let image_file = await open(image_path, "w", 0o666)
		await image_file.write(request.rawBody as Buffer);
		await image_file.close()
	})
}

export default example

