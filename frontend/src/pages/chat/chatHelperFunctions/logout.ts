import { Socket } from "socket.io-client";
import { __socket } from "../chat";


export function logout(socket: Socket) {
  socket.emit("logout");  // notify server
  socket.disconnect();    // actually close the socket
  localStorage.clear();
  if (__socket !== undefined)
		__socket.close();
};
