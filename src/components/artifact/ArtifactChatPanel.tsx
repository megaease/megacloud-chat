// components/artifact/ArtifactChatPanel.tsx
"use client";

import { memo } from "react";
import { ArtifactChat } from "./ArtifactChat";
import type { UIMessage } from "ai";

interface ArtifactChatPanelProps {
  chatId: string;
  messages: UIMessage[];
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

export const ArtifactChatPanel = memo(function ArtifactChatPanel({
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
}: ArtifactChatPanelProps) {
  return (
    <ArtifactChat
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
