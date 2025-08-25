import { FastifyPluginAsync } from "fastify";

import { Static, Type } from "@sinclair/typebox";


export const WhoAmIRes = Type.String({ description: "username" });

export type WhoAmIRes = Static<typeof WhoAmIRes>;

const route: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	fastify.get(
		"/whoami",
		{ schema: { response: { "2xx": WhoAmIRes } } },
		async function(req, res) {
			return "yes";
		},
	);
};

export default route;
