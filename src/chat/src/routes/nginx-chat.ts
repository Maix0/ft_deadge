import { FastifyPluginAsync } from 'fastify';
import { MakeStaticResponse, typeResponse } from '@shared/utils';
import { Type } from '@sinclair/typebox';
import Fastify from 'fastify'
import { Server } from "socket.io"
import { Socket } from "socket.io";


const fastify = Fastify();

const io = new Server(fastify.server, {
  path: "/app/chat/socket.io/",
  cors: { origin: "*" },
});



io.on("connection", (socket: Socket) => {
  console.log("testing")
  console.log(`Client connected: ${socket.id}`);
	socket.on("message", (data: any) => console.log(data, `socketID: ${socket.id}`));
	socket.once("message", () => socket.send("connected succesfully"));
	socket.once("coucou", (data: any) => console.log(data))
});


export const ChatRes = {
	200: typeResponse('success', 'chat.success', {
		name: Type.String(),
		id: Type.String(),
		guest: Type.Boolean(),
	}),
};

export type ChatResType = MakeStaticResponse<typeof ChatRes>;

const route: FastifyPluginAsync = async (fastify): Promise<void> => {
	fastify.get(
		'/api/chat/test',
		{
			schema: {
				response: ChatRes,
				operationId: 'chatTest',
			},
			config: { requireAuth: true },
		},
		async (req, res) => {
			console.log('/api/chat called =================>');
			res.makeResponse(200, 'success', 'chat.success', { name: req.authUser!.name, 'id': req.authUser!.id, guest: false });
		},
	);
};
export default route;
