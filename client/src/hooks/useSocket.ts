import { useEffect } from "react";
import { useSocketContext } from "@/context/SocketContext";

export function useSocketEvent<T = any>(
  event: string,
  handler: (data: T) => void,
) {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler]);
}

// usage example:
// useSocketEvent<MessageDTO>("message:new", (msg) => { ... })
