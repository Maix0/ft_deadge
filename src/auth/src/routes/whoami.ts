import { FastifyPluginAsync } from "fastify";

import { Static, Type } from "@sinclair/typebox";
import { makeResponse, typeResponse } from "@shared/utils"


export const WhoAmIRes = typeResponse("success", "whoami.success", { name: Type.String() });

export type WhoAmIRes = Static<typeof WhoAmIRes>;

const route: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	fastify.get(
		"/api/auth/whoami",
		{ schema: { response: { "2xx": WhoAmIRes } }, config: { requireAuth: true } },
		async function(req, res) {
			return makeResponse("success", "whoami.success", { name: req.authUser?.name })
		},
	);
};

export default route;
