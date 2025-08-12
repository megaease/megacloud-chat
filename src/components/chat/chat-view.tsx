"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./chat-message";
import {
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
} from "@/components/prompt-kit/chat-container";
import type { UIMessage } from "ai";
import { ChatInput } from "./chat-input";
import { EditConfirmationDialog } from "./edit-confirmation-dialog";
import { Loader } from "@/components/prompt-kit/loader";
import { ScrollButton } from "@/components/prompt-kit/scroll-button";
// import { Artifact } from "../artifact/Artifact"; // 已删除

// Define the Model interface
interface Model {
  id: string;
  name: string;
}

interface ChatViewProps {
  messages: UIMessage[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    options?: { experimental_attachments?: FileList }
  ) => void;
  handleStopGeneration: () => void;
  error: Error | null;
  reload: () => void;
  retry: () => void;
  regenerate: () => void;
  mcpEnabled: boolean;
  toggleMcpEnabled: () => boolean;
  status: "error" | "submitted" | "streaming" | "ready";
  isUploading?: boolean;
  onEditMessage?: (
    messageId: string,
    newContent: string,
    options?: {
      regenerateAI?: boolean;
      deleteSubsequent?: boolean;
    }
  ) => Promise<void>;
  onStartEdit?: (messageId: string) => void;
  onCancelEdit?: () => void;
  editingMessageId?: string | null;
}

export function ChatView({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  handleStopGeneration,
  error,
  reload,
  retry,
  regenerate,
  mcpEnabled,
  toggleMcpEnabled,
  status,
  isUploading = false,
  onEditMessage,
  onStartEdit,
  onCancelEdit,
  editingMessageId,
}: ChatViewProps) {
  const tCommon = useTranslations("Common");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Edit state management (now handled by parent component)
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);
  const [editedMessageData, setEditedMessageData] = useState<{
    messageId: string;
    newContent: string;
  } | null>(null);

  // Handle save edit
  const handleSaveEdit = async (messageId: string, newContent: string) => {
    if (!onEditMessage) return;

    try {
      // Call parent component's edit handler which includes local state update
      await onEditMessage(messageId, newContent);
      // Don't set editingMessageId to null here - let the parent handle it
    } catch (error) {
      console.error("Failed to save edited message:", error);
      throw error;
    }
  };

  // Handle edit confirmation
  const handleEditConfirmation = async (
    regenerateAI: boolean,
    deleteSubsequent: boolean
  ) => {
    if (!editedMessageData || !onEditMessage) return;

    try {
      await onEditMessage(
        editedMessageData.messageId,
        editedMessageData.newContent,
        {
          regenerateAI,
          deleteSubsequent,
        }
      );

      setShowEditConfirmation(false);
      setEditedMessageData(null);
    } catch (error) {
      console.error("Failed to save edited message:", error);
      // Error handling will be done by the parent component
      throw error;
    }
  };

  // Handle edit confirmation cancel
  const handleEditConfirmationCancel = () => {
    setShowEditConfirmation(false);
    setEditedMessageData(null);
  };

  // Prompt Kit chat container manages scroll stickiness; no custom hook needed

  return (
    <div className={cn("flex flex-col h-full transition-all relative")}>
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-primary">Start a conversation</p>
        </div>
      ) : (
        <div
          className="flex-1 relative min-h-0  overflow-auto"
          ref={scrollContainerRef}
        >
          <ChatContainerRoot
            className="h-full px-2 sm:px-4"
            data-scroll-container
          >
            <ChatContainerContent className="w/full max-w-4xl mx-auto flex flex-col gap-2 py-4">
              {messages.map((message, index) => {
                const isLastMessage = index === messages.length - 1;
                const isEditing = editingMessageId === message.id;
                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isLoading={
                      (status === "streaming" || status === "submitted") &&
                      isLastMessage
                    }
                    isLastMessage={isLastMessage}
                    error={error}
                    status={status}
                    retry={retry}
                    regenerate={regenerate}
                    onEdit={onStartEdit}
                    onCancelEdit={onCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    isEditing={isEditing}
                  />
                );
              })}
              <ChatContainerScrollAnchor />
            </ChatContainerContent>
            {/* ScrollButton 在 ChatContainerRoot 内部，按照参考代码结构 */}
            {/* 自定义 ScrollButton - 总是显示，功能完整 */}
            <div className="absolute right-6 bottom-4 z-50">
              <ScrollButton
                containerRef={
                  scrollContainerRef as React.RefObject<HTMLElement>
                }
              />
            </div>
          </ChatContainerRoot>
        </div>
      )}

      {/* Chat input - 固定在底部 */}
      <div className="flex-shrink-0">
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          handleStopGeneration={handleStopGeneration}
          mcpEnabled={mcpEnabled}
          toggleMcpEnabled={toggleMcpEnabled}
          status={status}
          isUploading={isUploading}
        />
      </div>
      {/* Edit Confirmation Dialog */}
      <EditConfirmationDialog
        isOpen={showEditConfirmation}
        onClose={handleEditConfirmationCancel}
        onConfirm={handleEditConfirmation}
        hasSubsequentMessages={
          editedMessageData
            ? messages.findIndex((m) => m.id === editedMessageData.messageId) <
              messages.length - 1
            : false
        }
      />
    </div>
  );
}
