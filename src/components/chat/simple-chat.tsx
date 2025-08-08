"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

export function SimpleChat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input?.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          {message.role === "user" ? "User: " : "AI: "}
          {message.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("")}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
