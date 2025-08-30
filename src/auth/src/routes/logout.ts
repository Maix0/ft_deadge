import { FastifyPluginAsync } from "fastify";

const route: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	fastify.post(
		"/api/auth/logout",
		async function(req, res) {
			return res.clearCookie("token").send("bye :(")
		},
	);
};

export default route;
