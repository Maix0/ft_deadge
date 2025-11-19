////WORKING ON THE SEPARATE NONO FUCTIONNELING SOCKET CLIENT TO BE IMPORTED INTO CHAT.TS////

// import io from "socket.io-client"; 

// // const socket = io("wss://localhost:8888");

// export const socket = io("wss://localhost:8888", {
// 	path: "/api/chat/socket.io/",
// 	secure: false,
// 	transports: ["websocket"],
// });

// // Listen for the 'connect' event
// socket.on("connect", async () => {
// 	console.log("I AM Connected to the server: ", socket.id);
// 	// Emit a custom event 'coucou' with some data
// 	socket.emit("MsgObjectClient", { message: " Nigel from coucou!" });
// 	console.log('sent console.log coucou');
// 	// Send a message to the server
// 	socket.send(" from the client: " + `${socket.id}`);
// 	console.log("MESSAGE REPLY RETURNED FROM SERVER =====>: ", socket.emit("", {: " Nigel from coucou!"}).id);
// });


// // Listen for messages from the server
// socket.on("MsgObjectServer", (data) => {
//   console.log("Message from server:", data);
// });

// socket.on("", (data) => {
//   console.log("MESSAGE REPLY RETURNED FROM SERVER =====>:", data);
// });


// // Disconnected
// socket.on("disconnect", (reason) => {
//   console.log("Socket disconnected:", reason);
// });

// // Socket.IO connection errors
// socket.on("connect_error", (err) => {
//   console.error("Connection error:", err.message);
// });

// // Server-side errors
// socket.on("error", (err) => {
//   console.error("Socket error:", err);
// });
