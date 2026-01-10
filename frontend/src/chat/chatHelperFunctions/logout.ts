import { Socket } from "socket.io-client";


export function logout(socket: Socket) {
  socket.emit("logout");  // notify server
  socket.disconnect();    // actually close the socket
  localStorage.clear();
  if (window.__state.chatSock !== undefined)
		window.__state.chatSock.close();
};
