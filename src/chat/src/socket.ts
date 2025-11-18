import { Server } from 'socket.io';

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
	interface FastifyInstance {
		io: Server<{
			hello: (message: string) => string,
			MsgObjectServer: (data: { message: string }) => void,
			message: (msg: string) => void,
		}>
	}
}

export function setupSocketIo(fastify: import('fastify').FastifyInstance): void {

fastify.ready((err) => {
		if (err) throw err;

		fastify.io.on('connection', (socket) => {
			console.info('Socket connected!', socket.id);
			socket.on('hello', (value) => {
				return 'hi';
			});
			socket.emit("MsgObjectServer", {message: `THIS IS A SERVER MESSAGE`});
			socket.on('message', (value) => console.log(`GOT MESssSAGE ${value}`));
			socket.on('MsgObjectServer', (value) => console.log(`GOT COUCOU ${value.message}`));
		},);
    });
};






