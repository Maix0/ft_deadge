import { FastifyPluginAsync } from 'fastify';
import multipart from '@fastify/multipart';
import { MakeStaticResponse, typeResponse } from '@shared/utils';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import path from 'path';
import fs from 'node:fs/promises';


export const IconSetRes = {
	'200': typeResponse('success', 'iconset.success'),
	'400': typeResponse('success', ['iconset.failure.invalidFile', 'iconset.failure.noFile']),
};

export type IconSetRes = MakeStaticResponse<typeof IconSetRes>;

const validMimeTypes = new Set([
	'image/jpeg',
	'image/png',
]);

async function resizeAndSaveImage(
	imageBuffer: Buffer,
	filename: string,
): Promise<void> {
	const outputDir = '/volumes/icons/';
	const outputPath = path.join(outputDir, filename);

	// Ensure the directory exists
	await fs.mkdir(outputDir, { recursive: true });

	await sharp(imageBuffer)
		.resize(512, 512, {
			fit: 'cover',
		})
		.png()
		.toFile(outputPath);
}

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	await fastify.register(multipart);
	fastify.post(
		'/api/icons/set',
		{ schema: { response: IconSetRes, operationId: 'setIcons' }, config: { requireAuth: true } },
		async function(req, res) {
			// req.authUser is always set, since this is gated
			const userid = req.authUser!.id;
			const file = await req.file();
			if (!file) {
				return res.makeResponse(400, 'failure', 'iconset.failure.noFile');
			}
			if (!validMimeTypes.has(file.mimetype)) {
				return res.makeResponse(400, 'failure', 'iconset.failure.invalidFile');
			}
			const buf = await file.toBuffer();
			if (!validMimeTypes.has((await fileTypeFromBuffer(buf))?.mime ?? 'unknown')) {
				return res.makeResponse(400, 'failure', 'iconset.failure.invalidFile');
			}
			try {
				resizeAndSaveImage(buf, userid);
				return res.makeResponse(200, 'success', 'iconset.success');
			}
			catch (e: unknown) {
				this.log.warn(e);
				return res.makeResponse(400, 'failure', 'iconset.failure.invalidFile');
			}
		},
	);
};

export default route;
