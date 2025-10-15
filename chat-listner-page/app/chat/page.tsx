"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authApi, chatApi } from "@/lib/api";
import { useChat } from "@/hooks/useChat";
import { Message, Listener } from "@/types";

export default function ChatPage() {
  const router = useRouter();
  const [listener, setListener] = useState<Listener | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get listener info and setup chat
  useEffect(() => {
    const token = localStorage.getItem("listener_token");
    if (!token) {
      router.push("/login");
      return;
    }

    authApi
      .getMe()
      .then((data) => {
        setListener(data);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("listener_token");
        router.push("/login");
      });
  }, [router]);

  const { messages, conversations, isConnected, joinConversation, sendMessage } = useChat(
    listener?.login_id || ""
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages]);

  // Filter messages for selected conversation
  useEffect(() => {
    if (selectedConversation) {
      const filtered = messages.filter(
        (msg) => msg.conversation_id === selectedConversation
      );
      setConversationMessages(filtered);
    }
  }, [messages, selectedConversation]);

  // Load conversation history when selected
  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    joinConversation(conversationId);

    try {
      const history = await chatApi.getMessages(conversationId);
      setConversationMessages(history);
    } catch (error) {
      console.error("Failed to load conversation history:", error);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    sendMessage(selectedConversation, messageInput.trim());
    setMessageInput("");
  };

  const handleLogout = () => {
    authApi.logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Therapy Listener Dashboard</h1>
            <p className="text-sm text-blue-100">
              {listener?.name} ({listener?.login_id})
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-400" : "bg-red-400"
                }`}
              />
              <span className="text-sm">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Active Conversations
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {conversations.length} conversation(s)
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No active conversations</p>
                <p className="text-xs mt-2">
                  Waiting for incoming messages...
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {conversations.map((convId) => {
                  const convMessages = messages.filter(
                    (msg) => msg.conversation_id === convId
                  );
                  const lastMessage = convMessages[convMessages.length - 1];

                  return (
                    <button
                      key={convId}
                      onClick={() => handleSelectConversation(convId)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedConversation === convId ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="font-medium text-gray-900 text-sm">
                        Conversation {convId.slice(0, 8)}...
                      </div>
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {lastMessage?.content || "New conversation"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {convMessages.length} message(s)
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedConversation ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversationMessages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>No messages yet in this conversation</p>
                  </div>
                ) : (
                  conversationMessages.map((msg, idx) => {
                    const isListener = msg.sender_id === listener?.login_id;

                    return (
                      <div
                        key={msg._id || idx}
                        className={`flex ${
                          isListener ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-lg px-4 py-2 rounded-lg ${
                            isListener
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-900 border border-gray-200"
                          }`}
                        >
                          <div className="text-sm">{msg.content}</div>
                          <div
                            className={`text-xs mt-1 ${
                              isListener ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {msg.sent_at
                              ? new Date(msg.sent_at).toLocaleTimeString()
                              : "Just now"}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 bg-white border-t border-gray-200"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-lg">Select a conversation to start chatting</p>
                <p className="text-sm text-gray-400 mt-2">
                  or wait for incoming messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
