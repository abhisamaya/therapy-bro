// UserB.js
import { useEffect, useState } from "react";
import io from "socket.io-client";

export default function UserB() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const conversationId = "test-room";

  useEffect(() => {
    // Load message history from API
    const loadHistory = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/conversations/${conversationId}/messages`);
        if (response.ok) {
          const history = await response.json();
          console.log("Loaded history:", history);
          setMessages(history);
        }
      } catch (error) {
        console.error("Failed to load history:", error);
      }
    };

    loadHistory();

    const s = io("http://localhost:8000", { query: { userB: true } }); // connect as User B
    setSocket(s);

    s.on("connect", () => {
      console.log("Connected as User B");
      s.emit("join_conversation", { conversation_id: conversationId });
    });

    s.on("message", (msg) => {
      console.log("Received:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    s.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    return () => s.disconnect();
  }, []);

  const sendMessage = () => {
    if (!socket || !input) return;
    socket.emit("send_message", { conversation_id: conversationId, content: input });
    setInput("");
  };

  return (
    <div>
      <h2>User B Chat</h2>
      <div style={{ border: "1px solid black", height: "200px", overflowY: "auto", padding: "5px" }}>
        {messages.map((m, i) => (
          <div key={i}>
            <b>{m.sender_id}:</b> {m.content}
          </div>
        ))}
      </div>
      <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type message" />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
