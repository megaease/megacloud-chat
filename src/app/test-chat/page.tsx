"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

export default function TestChat() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages, id, body }) => {
        return {
          body: {
            id,
            message: messages.at(-1),
            chatId: id,
            userId: "test-user",
            modelName: "deepseek-chat",
            providerType: "deepseek",
            ...body,
          },
        };
      },
    }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input?.trim()) {
      sendMessage({
        text: input,
      });
      setInput("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI SDK 5 Test Chat</h1>

      <div className="space-y-4 mb-4 h-96 overflow-y-auto border p-4 rounded">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              <div className="text-xs opacity-70 mb-1">{message.role}</div>
              {message.parts?.map((part, partIndex) => {
                if (part.type === "text") {
                  return <div key={`part-${partIndex}`}>{part.text}</div>;
                }
                return null;
              })}
            </div>
          </div>
        ))}
        {status === "streaming" && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-black max-w-xs px-4 py-2 rounded-lg">
              <div className="text-xs opacity-70 mb-1">assistant</div>
              <div>Thinking...</div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border rounded px-3 py-2"
          disabled={status === "streaming"}
        />
        <button
          type="submit"
          disabled={status === "streaming" || !input?.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Send
        </button>
      </form>

      <div className="mt-2 text-sm text-gray-500">Status: {status}</div>
    </div>
  );
}
