"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./chat-message";
import type { Message } from "@ai-sdk/react";
import { ChatInput } from "./chat-input";
import { EditConfirmationDialog } from "./edit-confirmation-dialog";
import { Thinking } from "./thinking";

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

// 估算消息高度的函数 - 更精确的高度估算
const estimateMessageSize = (message: Message): number => {
  // 基础高度
  let baseHeight = 80;
  
  // 根据角色调整
  if (message.role === "assistant") {
    baseHeight = 120;
  } else if (message.role === "system") {
    baseHeight = 60;
  }
  
  // 根据内容长度调整
  const contentLength = message.content?.length || 0;
  if (contentLength > 500) {
    baseHeight += Math.min(Math.floor(contentLength / 200) * 30, 300);
  } else if (contentLength > 100) {
    baseHeight += Math.floor(contentLength / 100) * 15;
  }
  
  // 检查是否有附件
  if (message.experimental_attachments && message.experimental_attachments.length > 0) {
    baseHeight += message.experimental_attachments.length * 80;
  }
  
  // 检查是否有工具调用
  if (message.toolInvocations && message.toolInvocations.length > 0) {
    baseHeight += message.toolInvocations.length * 120;
  }
  
  // 检查是否有代码块 (粗略估算)
  const codeBlockCount = (message.content?.match(/```/g) || []).length / 2;
  if (codeBlockCount > 0) {
    baseHeight += codeBlockCount * 150;
  }
  
  return Math.max(baseHeight, 60); // 最小高度
};

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
  
  // 虚拟滚动容器的引用
  const parentRef = useRef<HTMLDivElement>(null);
  
  // 编辑状态管理
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);
  const [editedMessageData, setEditedMessageData] = useState<{
    messageId: string;
    newContent: string;
  } | null>(null);

  // 创建虚拟化器
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index: number) => {
      const message = messages[index];
      if (!message) return 100; // 默认高度
      return estimateMessageSize(message);
    }, [messages]),
    overscan: 5, // 预渲染5个项目
    // 启用动态大小调整
    measureElement: (element) => {
      // 返回元素的实际高度，用于精确测量
      return element?.getBoundingClientRect().height ?? 0;
    },
  });

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, {
        align: 'end',
        behavior: 'smooth',
      });
    }
  }, [virtualizer, messages.length]);

  // 检查是否在底部附近
  const isNearBottom = useCallback(() => {
    if (!parentRef.current) return true;
    
    const scrollElement = parentRef.current;
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const threshold = 100; // 100px 阈值
    
    return scrollTop + clientHeight >= scrollHeight - threshold;
  }, []);

  // 当有新消息时自动滚动到底部
  useEffect(() => {
    if (messages.length > 0 && isNearBottom()) {
      // 延迟滚动，确保 DOM 更新完成
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToBottom, isNearBottom]);

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

  // 检查用户是否手动滚动了
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      setIsAtBottom(isNearBottom());
    };

    scrollElement.addEventListener("scroll", handleScroll);
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [isNearBottom]);

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
              contain: 'strict',
            }}
          >
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: '100%',
                position: 'relative',
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
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
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