import { FastifyPluginAsync } from 'fastify'
import { join } from 'node:path'
import { open } from 'node:fs/promises'
import sharp from 'sharp'
import { newUUIDv7 } from '@shared/uuid'
import rawBody from 'raw-body'

const route: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	// await fastify.register(authMethod, {});
	// here we register plugins that will be active for the current fastify instance (aka everything in this function)

	// we register a route handler for: `/<USERID_HERE>`
	// it sets some configuration options, and set the actual function that will handle the request

	fastify.addContentTypeParser('*', function(request, payload, done) {
		done()
	});

	fastify.post('/:userid', async function(request, reply) {
		let buffer = await rawBody(request.raw);
		// this is how we get the `:userid` part of things
		const userid: string | undefined = (request.params as any)['userid'];
		if (userid === undefined) {
			return await reply.code(403);
		}
		const image_store: string = fastify.getDecorator('image_store')
		const image_path = join(image_store, userid)

		try {
			let img = sharp(buffer);
			img.resize({
				height: 128,
				width: 128,
				fit: 'fill',
			})
			const data = await img.png({ compressionLevel: 6 }).toBuffer()
			let image_file = await open(image_path, "w", 0o666)
			await image_file.write(data);
			await image_file.close()
		} catch (e: any) {
			fastify.log.error(`Error: ${e}`);
			reply.code(400);
			return { status: "error", message: e.toString() };
		}
	})
}

export default route

