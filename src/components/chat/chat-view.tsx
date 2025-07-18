"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./chat-message";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import type { Message } from "@ai-sdk/react";
import { ChatInput } from "./chat-input";
import { EditConfirmationDialog } from "./edit-confirmation-dialog";
import { Thinking } from "./thinking";
// import { Artifact } from "../artifact/Artifact"; // 已删除

// Define the Model interface
interface Model {
  id: string;
  name: string;
}

interface ChatViewProps {
  messages: Message[];
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

  // Use the enhanced scroll-to-bottom hook
  const { scrollAreaRef, endRef, isAtBottom, scrollToBottom } =
    useScrollToBottom({
      behavior: "smooth",
      bottomThreshold: 50,
      scrollOnMount: true,
      forceScrollOnNewContent: false,
    });

  return (
    <div className={cn("flex flex-col h-full transition-all relative")}>
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-primary">Start a conversation</p>
        </div>
      ) : (
        <div className="flex-1 relative min-h-0">
          <div
            className="h-full overflow-y-auto px-2 sm:px-4 space-y-4"
            ref={scrollAreaRef}
            id="scrollable-chat"
          >
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-2 py-4">
              {messages.map((message, index) => {
                const isLastMessage = index === messages.length - 1;
                const isEditing = editingMessageId === message.id;
                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isLoading={status === "streaming" && isLastMessage}
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
            </div>
            {/* Invisible element to mark the bottom for scrolling */}
            <div ref={endRef} />
          </div>

          {/* 滚动到底部按钮 */}
          {!isAtBottom && (
            <div className="absolute bottom-4 right-4 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={scrollToBottom}
                className="rounded-full shadow-lg bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
      {status === "submitted" && (
        <div className="flex-shrink-0">
          <Thinking />
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
