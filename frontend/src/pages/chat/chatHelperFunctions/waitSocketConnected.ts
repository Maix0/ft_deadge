import { Socket } from "socket.io-client";

/**
 * function waits for the socket to be connected and when connected calls socket.on "connect"
 * @param socket 
 * @returns 
 */

export function waitSocketConnected(socket: Socket): Promise<void> {
    return new Promise(resolve => {
        if (socket.connected) return resolve();
        socket.on("connect", () => resolve());
    });
};