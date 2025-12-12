// @file run.ts
// @brief The entrypoint to the service.

// Entry point of the microservice, ran by the Dockerfile.

import fastify, { FastifyInstance } from 'fastify';
import app from './app';
// TODO: Import the microservice app

// @brief Entrypoint for the microservice's backend.
const start = async () => {
	// TODO: Thingies to send to log service (if I understood that correctly from /src/chat/src/run.ts)

	// TODO: Add the logging thingy to the call to fastify()
	const fastInst: FastifyInstance = fastify();
	try {
		process.on('SIGTERM', () => {
			fastInst.log.info('Requested to shutdown');
			process.exit(143);
		});
		// TODO: Uncomment when app.ts will be import-able.
		await fastInst.register(app);
		await fastInst.listen({ port: 80, host: '0.0.0.0' });
	}
	catch (err) {
		fastInst.log.error(err);
		process.exit(1);
	};
};

start();