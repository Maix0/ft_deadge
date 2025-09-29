import { FastifyPluginAsync } from 'fastify';

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.post(
		'/api/auth/logout',
		async function(_req, res) {
			void _req;
			return res.clearCookie('token').send('{}');
		},
	);
};

export default route;
