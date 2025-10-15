"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Message } from "@/types";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";

export const useChat = (listenerId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!listenerId) return;

    // Create socket connection with listener ID
    const newSocket = io(SOCKET_URL, {
      query: { userId: listenerId },
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Connected as listener:", listenerId);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected");
      setIsConnected(false);
    });

    // Listen for incoming messages
    newSocket.on("message", (data: Message) => {
      console.log("Received message:", data);
      setMessages((prev) => [...prev, data]);

      // Track conversation
      if (data.conversation_id) {
        setConversations((prev) => new Set(prev).add(data.conversation_id));
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [listenerId]);

  const joinConversation = useCallback((conversationId: string) => {
    if (!socket) return;
    socket.emit("join_conversation", { conversation_id: conversationId });
    setConversations((prev) => new Set(prev).add(conversationId));
  }, [socket]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (!socket) return;
    socket.emit("leave_conversation", { conversation_id: conversationId });
  }, [socket]);

  const sendMessage = useCallback((conversationId: string, content: string, metadata?: Record<string, any>) => {
    if (!socket) return;

    const message: Message = {
      conversation_id: conversationId,
      sender_id: listenerId,
      content,
      metadata,
    };

    socket.emit("send_message", message);
    setMessages((prev) => [...prev, message]);
  }, [socket, listenerId]);

  return {
    socket,
    messages,
    conversations: Array.from(conversations),
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
  };
};
