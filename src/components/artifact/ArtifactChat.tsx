"use client";

import type { UIMessage } from "ai";
import { ArtifactMessage } from "./ArtifactMessage";
import { ChatInput } from "@/components/chat/chat-input";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";

interface ChatMessageProps {
  message: UIMessage | UIMessage;
  isLoading: boolean;
  isCompact?: boolean; // Compact mode for narrow screens like Artifact sidebar
  isLastMessage?: boolean;
  error?: Error | null;
  status?: "error" | "submitted" | "streaming" | "ready";
  retry?: () => void;
  regenerate?: () => void;
  onEdit?: (messageId: string) => void;
  onCancelEdit?: () => void;
  onSaveEdit?: (messageId: string, content: string) => Promise<void>;
  isEditing?: boolean;
}

// Create a proper ArtifactChat component that matches the expected interface
interface ArtifactChatProps {
  className?: string;
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
}

export function ArtifactChat(props: ArtifactChatProps) {
  const { scrollAreaRef, endRef, isAtBottom, scrollToBottom } =
    useScrollToBottom({
      behavior: "smooth",
      bottomThreshold: 50,
      scrollOnMount: true,
      forceScrollOnNewContent: false,
    });

  return (
    <div
      className={`flex flex-col h-full min-h-0 bg-white dark:bg-white ${
        props.className || ""
      }`}
    >
      <div className="flex-1 relative min-h-0">
        <div
          className="h-full overflow-y-auto px-2 sm:px-3 space-y-3"
          ref={scrollAreaRef}
        >
          <div className="w-full mx-auto flex flex-col gap-2 py-3">
            {props.messages.map((message, index) => (
              <ArtifactMessage
                key={message.id}
                message={message}
                isLoading={
                  props.status === "streaming" &&
                  index === props.messages.length - 1
                }
              />
            ))}
          </div>
          <div ref={endRef} />
        </div>

        {!isAtBottom && (
          <div className="absolute bottom-3 right-3 z-10">
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

      <div className="flex-shrink-0 border-t">
        <ChatInput
          input={props.input}
          handleInputChange={props.handleInputChange}
          handleSubmit={props.handleSubmit}
          handleStopGeneration={props.stop}
          mcpEnabled={props.mcpEnabled}
          toggleMcpEnabled={props.toggleMcpEnabled}
          status={props.status}
          isUploading={props.isUploading}
          className="max-w-none"
        />
      </div>
    </div>
  );
}

// Export as both ChatMessage and ArtifactChat for compatibility
// Remove the duplicate export
