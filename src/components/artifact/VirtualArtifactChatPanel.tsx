// components/artifact/VirtualArtifactChatPanel.tsx
"use client";

import { memo } from "react";
import { VirtualArtifactChat } from "./VirtualArtifactChat";
import type { Message } from "@ai-sdk/react";

interface VirtualArtifactChatPanelProps {
  chatId: string;
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    options?: { experimental_attachments?: FileList }
  ) => void;
  status: "error" | "submitted" | "streaming" | "ready";
  stop: () => void;
  error: Error | undefined;
  reload: () => void;
  isUploading: boolean;
  mcpEnabled: boolean;
  toggleMcpEnabled: () => boolean;
  className?: string;
}

export const VirtualArtifactChatPanel = memo(function VirtualArtifactChatPanel({
  chatId,
  messages,
  input,
  handleInputChange,
  handleSubmit,
  status,
  stop,
  error,
  reload,
  isUploading,
  mcpEnabled,
  toggleMcpEnabled,
  className,
}: VirtualArtifactChatPanelProps) {
  return (
    <VirtualArtifactChat
      className={className}
      chatId={chatId}
      messages={messages}
      input={input}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      status={status}
      stop={stop}
      error={error}
      reload={reload}
      isUploading={isUploading}
      mcpEnabled={mcpEnabled}
      toggleMcpEnabled={toggleMcpEnabled}
    />
  );
});
