// components/artifact/VirtualArtifactChat.tsx
"use client";

import { useState } from "react";
import type { Message } from "@ai-sdk/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatInput } from "../chat/chat-input";
import { ArtifactMessage } from "./ArtifactMessage";
import { useChatVirtualScroll } from "@/hooks/use-chat-virtual-scroll";

interface VirtualArtifactChatProps {
  className?: string;
  chatId?: string;
  // Chat state from parent component
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
}

export function VirtualArtifactChat({
  className,
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
}: VirtualArtifactChatProps) {
  // 使用优化的虚拟滚动hook
  const { virtualizer, parentRef, isAtBottom, scrollToBottom } =
    useChatVirtualScroll(messages, {
      behavior: "smooth",
      bottomThreshold: 50, // Artifact中使用更小的阈值
      overscan: 3, // Artifact聊天中预渲染3个项目
      debug: process.env.NODE_ENV === "development",
    });

  // Form submission handler
  const handleFormSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    options?: { experimental_attachments?: FileList }
  ) => {
    e.preventDefault();

    if (!input.trim() && !options?.experimental_attachments) return;

    // Prevent multiple submissions
    if (status === "streaming" || status === "submitted" || isUploading) {
      return;
    }

    try {
      handleSubmit(e, options);
    } catch (error) {
      toast.error("Failed to send message", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Stop generation handler
  const handleStopGeneration = () => {
    stop();
    toast.info("Generation stopped");
  };

  return (
    <div className={cn("flex flex-col h-full bg-card", className)}>
      {/* Message list area */}
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="text-center px-4">
            <p className="text-sm text-muted-foreground">
              Start a new conversation
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Chat with AI here
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 relative min-h-0">
          <div
            ref={parentRef}
            className="h-full overflow-y-auto overflow-x-hidden px-2"
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
                    <div className="py-1">
                      <ArtifactMessage
                        message={message}
                        isLoading={status === "streaming" && isLastMessage}
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

      {/* Chat input area */}
      <div className="flex-shrink-0 p-2">
        {/* Error display */}
        {error && (
          <div className="px-3 py-2 bg-destructive/10 border-t border-destructive/20">
            <p className="text-xs text-destructive">Error: {error.message}</p>
            <button
              type="button"
              onClick={() => reload()}
              className="text-xs text-destructive underline mt-1"
            >
              Retry
            </button>
          </div>
        )}
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleFormSubmit}
          handleStopGeneration={handleStopGeneration}
          mcpEnabled={mcpEnabled}
          toggleMcpEnabled={toggleMcpEnabled}
          status={status}
          isUploading={isUploading}
          className="max-w-none"
        />
      </div>
    </div>
  );
}
