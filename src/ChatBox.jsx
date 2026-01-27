import { useState } from "react";
import { useCall } from "./Context";

export default function ChatBox({ to }) {
  const { messages, sendMessage } = useCall();
  const [text, setText] = useState("");

  return (
    <div className="chat-box">
      <h4>Chat</h4>

      {/* 👇 HERE MESSAGE DISPLAY */}
      <div className="messages">
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.self ? "right" : "left",
              margin: "4px 0",
            }}
          >
            <b>{m.self ? "You" : m.from}:</b> {m.message}
          </div>
        ))}
      </div>

      {/* 👇 INPUT */}
      <input
        value={text}
        placeholder="Type message"
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={() => {
          sendMessage(to, text);
          setText("");
        }}
      >
        Send
      </button>
    </div>
  );
}
