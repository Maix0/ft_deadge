import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';

export const useSwagger = fp(async (fastify, opts: { service: string }) => {
	await fastify.register(fastifySwagger, {
		openapi: {
			openapi: '3.1.0',
			servers: [
				{
					url: 'https://local.maix.me:8888',
					description: 'direct from docker',
				},
				{
					url: 'https://local.maix.me:8000',
					description: 'using fnginx',
				},
			],
		},
	});
	await fastify.register(fastifySwaggerUi, {
		routePrefix: `/api/${opts.service}/documentation`,
	});
});

export default useSwagger;
