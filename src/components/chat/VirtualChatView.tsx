"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./chat-message";
import type { Message } from "@ai-sdk/react";
import { ChatInput } from "./chat-input";
import { EditConfirmationDialog } from "./edit-confirmation-dialog";
import { Thinking } from "./thinking";
import { useVirtualChatScroll } from "@/hooks/use-virtual-chat-scroll";

interface VirtualChatViewProps {
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

export function VirtualChatView({
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
}: VirtualChatViewProps) {
  const tCommon = useTranslations("Common");

  // 使用优化的虚拟滚动hook
  const { virtualizer, parentRef, isAtBottom, scrollToBottom } =
    useVirtualChatScroll(messages, {
      behavior: "smooth",
      bottomThreshold: 80,
      overscan: 5,
      streamingScrollInterval: 150,
      debug: process.env.NODE_ENV === "development",
    });

  // 编辑状态管理
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);
  const [editedMessageData, setEditedMessageData] = useState<{
    messageId: string;
    newContent: string;
  } | null>(null);

  // 处理编辑相关函数
  const handleSaveEdit = async (messageId: string, newContent: string) => {
    if (!onEditMessage) return;

    try {
      await onEditMessage(messageId, newContent);
    } catch (error) {
      console.error("Failed to save edited message:", error);
      throw error;
    }
  };

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
      throw error;
    }
  };

  const handleEditConfirmationCancel = () => {
    setShowEditConfirmation(false);
    setEditedMessageData(null);
  };

  return (
    <div className={cn("flex flex-col h-full transition-all relative")}>
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-primary">Start a conversation</p>
        </div>
      ) : (
        <div className="flex-1 relative min-h-0">
          <div
            ref={parentRef}
            className="h-full overflow-y-auto px-2 sm:px-4"
            style={{
              contain: "strict",
            }}
          >
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const message = messages[virtualItem.index];
                if (!message) return null; // 安全检查

                const isLastMessage = virtualItem.index === messages.length - 1;
                const isEditing = editingMessageId === message.id;

                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <div className="w-full max-w-4xl mx-auto py-2">
                      <ChatMessage
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
                    </div>
                  </div>
                );
              })}
            </div>
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
        <div className="flex-shrink-0 relative">
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
