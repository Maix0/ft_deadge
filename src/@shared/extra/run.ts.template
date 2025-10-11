// this sould only be used by the docker file !

import fastify, { FastifyInstance } from 'fastify';
import app from './app';

const start = async () => {
	const envToLogger = {
		development: {
			transport: {
				target: 'pino-pretty',
				options: {
					translateTime: 'HH:MM:ss Z',
					ignore: 'pid,hostname',
				},
			},
		},
		production: true,
		test: false,
	};

	const f: FastifyInstance = fastify({ logger: envToLogger.development });
	process.on('SIGTERM', () => {
		f.log.info('Requested to shutdown');
		process.exit(134);
	});
	try {
		await f.register(app, {});
		await f.listen({ port: 80, host: '0.0.0.0' });
	}
	catch (err) {
		f.log.error(err);
		process.exit(1);
	}
};
start();
