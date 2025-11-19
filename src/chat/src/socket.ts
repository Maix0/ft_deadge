import { Server, Socket } from 'socket.io';
export const color = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
	interface FastifyInstance {
		io: Server<{
			hello: (message: string) => string,
			MsgObjectServer: (data: { message: string }) => void,
			message: (msg: string) => void,
			testend: (sock_id_client: string) => void,
		}>
	}
}





export function setupSocketIo(fastify: import('fastify').FastifyInstance): void {
	
	fastify.ready((err) => {
		if (err) throw err;
		
		function broadcast(message: any, sender?: any) {
			
			fastify.io.fetchSockets().then((sockets) => {
				console.log("Connected clients:", sockets.length);
    			for (const s of sockets) {
					
					if (s.id !== sender) {
						s.emit('MsgObjectServer',{ message: `${message}` });
						console.log("Socket ID:", s.id);
						console.log("Rooms:", [...s.rooms]);
						console.log("Sender:", sender ? sender : 'none');
					}
    			}
			});
		}
		
		// console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(fastify.io)));
		fastify.io.on('connection', (socket : Socket) => {
			console.info('Socket connected!', socket.id);
			// socket.on('hello', (value) => {
			// 	return 'hi';				
			// });
			
			// fastify.io.fetchSockets().then((sockets) => {
				//     console.log("Connected clients:", sockets.length);
				// 	for (const s of sockets) {
					// 	    console.log("Socket ID:", s.id);
					// 	    console.log("Rooms:", [...s.rooms]);
					// 	}
					// });
					
					
					
					// socket.emit("MsgObjectServer", {message: `THIS IS A SERVER MESSAGE`});
			socket.on('message', (message: string) => { 
				// console.log(color.red + `GOT MESSAGE ${color.reset} ${value}`);
				
				console.log(color.green + `GOT MESSAGE from client ${socket.id}: ${color.reset} ${message}`);
				const obj = JSON.parse(message);
    			const userID = obj.userID;
				console.log(`Message from client ${obj.userID}: ${obj.text}`);
				broadcast(`Broadcast from THIS server: ${obj.text}`,userID);
			});
				// socket.on('MsgObjectServer', (value) => { console.log(`GOT COUCOU ${value.message}`)
			//broadcast(`Broadcast from server:`, socket.id	);
			// });
			
			socket.on('testend', (sock_id_cl : string) => {
				console.log('testend received from client socket id:', sock_id_cl);
			});
			socket.on('disconnecting', (reason ) => {
				console.log("Client is disconnecting:", socket.id, "reason:", reason);
				console.log('Socket AAAAAAAActing because:', socket.connected);
			});
			
			
			
		});
		// fastify.io.on('disconnect', (socket : Socket) => {
			// 	console.log('weeeeeeeeeeeewoooooooooooooooooooooooooo');
			// 	console.log('alert in the high castle');
			// 	console.log('Socket disconnected!', socket.id);
			// });
		});

	};
	