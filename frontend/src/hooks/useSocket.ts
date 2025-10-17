import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

const globalSocket: Socket = io(import.meta.env.VITE_REACT_APP_SOCKET_BASE_URL as string, {
  transports: ["websocket"],
});

type Handlers = { [event: string]: (...args: any[]) => void };

export function useSocket(userId: string | null | undefined, handlers: Handlers = {}) {
  const socketRef = useRef<Socket>(globalSocket);

  useEffect(() => {
    if (!userId) return;
    const socket = socketRef.current;

    socket.emit("register", userId);

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [userId, JSON.stringify(Object.keys(handlers))]);

  return socketRef.current;
}
