import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export const useChat = (userId, token) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const newSocket = io("http://localhost:8000", {
      auth: { token },
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Connected as", userId);
    });

    newSocket.on("private_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userId, token]);

  const sendMessage = (receiverId, message) => {
    if (!socket) return;
    socket.emit("private_message", {
      sender_id: userId,
      receiver_id: receiverId,
      message,
    });
    setMessages((prev) => [
      ...prev,
      { sender_id: userId, receiver_id: receiverId, message },
    ]);
  };

  return { messages, sendMessage };
};
