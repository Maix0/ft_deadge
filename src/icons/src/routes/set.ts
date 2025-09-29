import { FastifyPluginAsync } from 'fastify';
import { join } from 'node:path';
import { open } from 'node:fs/promises';
import sharp from 'sharp';
import rawBody from 'raw-body';
import { isNullish } from '@shared/utils';

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	// await fastify.register(authMethod, {});
	// here we register plugins that will be active for the current fastify instance (aka everything in this function)

	// we register a route handler for: `/<USERID_HERE>`
	// it sets some configuration options, and set the actual function that will handle the request

	fastify.addContentTypeParser('*', function(request, payload, done) {
		done(null);
	});

	fastify.post<{ Params: { userid: string } }>('/:userid', async function(request, reply) {
		const buffer = await rawBody(request.raw);
		// this is how we get the `:userid` part of things
		const userid: string | undefined = (request.params)['userid'];
		if (isNullish(userid)) {
			return await reply.code(403);
		}
		const image_store: string = fastify.getDecorator('image_store');
		const image_path = join(image_store, userid);

		try {
			const img = sharp(buffer);
			img.resize({
				height: 128,
				width: 128,
				fit: 'fill',
			});
			const data = await img.png({ compressionLevel: 6 }).toBuffer();
			const image_file = await open(image_path, 'w', 0o666);
			await image_file.write(data);
			await image_file.close();
		}
		catch (e) {
			fastify.log.error(`Error: ${e}`);
			reply.code(400);
			return { status: 'error' };
		}
	});
};

export default route;

