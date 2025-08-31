import { FastifyPluginAsync } from "fastify";

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	fastify.post(
		"/api/auth/logout",
		async function(_req, res) {
			return res.clearCookie("token").send("{}")
		},
	);
};

export default route;
