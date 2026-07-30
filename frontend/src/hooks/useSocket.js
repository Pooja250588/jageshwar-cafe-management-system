import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api", "")
  : "http://localhost:5000";

let socketInstance = null;

/**
 * Returns the shared Socket.IO client instance.
 * Creates it once and reuses across the app.
 */
export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return socketInstance;
};

/**
 * Custom hook to listen to a socket event.
 * @param {string} event - Socket event name
 * @param {function} handler - Callback when event fires
 */
export const useSocketEvent = (event, handler) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    const listener = (...args) => handlerRef.current(...args);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [event]);
};

/**
 * Join a socket room.
 * @param {"admin"|"user"} type
 * @param {string} [userId] - required when type === "user"
 */
export const joinRoom = (type, userId) => {
  const socket = getSocket();
  if (type === "admin") {
    socket.emit("join-admin");
  } else if (type === "user" && userId) {
    socket.emit("join-user", userId);
  }
};
