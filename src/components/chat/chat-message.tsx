"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  IconFileText,
  IconDownload,
  IconFileTypography,
  IconAlertCircle,
} from "@tabler/icons-react";
import { Spinner } from "../spinner";
import { Markdown } from "../markdown";
import { CopyButton } from "../copy-button";
import type {
  MessagePart,
  ToolInvocationPart as ToolInvocationPartType,
} from "@/types/tool-invocation";
import { adaptToToolInvocationPart } from "@/lib/ai/tool-part-utils";
import { ChatItem } from "./chat-item";
import { MessageEditor } from "./message-editor";
import { ReasoningPart } from "./reasoning-part";
import { FilePreviewDialog } from "@/components/ui/file-preview-dialog";
import { ToolInvocationPart } from "./tool-invocation-part";
import { Button } from "@/components/ui/button";
import { ImagePreviewDialog } from "@/components/ui/image-preview-dialog";
import { useEditMessage } from "@/hooks/use-edit-message";

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

// Lightweight shared shapes to avoid `any`
type Attachment = { url: string; name?: string; contentType?: string };
type MaybeContentMessage = { content?: unknown };
type MaybePartsMessage = { parts?: Array<{ type?: string; text?: string }> };
type MaybeAttachmentsMessage = {
  experimental_attachments?: Attachment[];
  attachments?: Attachment[];
};

// Helper function to get message content safely
function getMessageContent(message: UIMessage): string {
  const msgWithContent = message as unknown as MaybeContentMessage &
    MaybePartsMessage;
  // Try to get content from the legacy content field first
  if (typeof msgWithContent.content !== "undefined") {
    const c = msgWithContent.content;
    if (typeof c === "string") return c;
    try {
      return JSON.stringify(c);
    } catch {
      return String(c);
    }
  }

  // Try to extract text from parts
  const parts = msgWithContent.parts;
  if (Array.isArray(parts)) {
    const textParts = parts
      .filter((part): part is { type?: string; text?: string } => Boolean(part))
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text as string)
      .filter(Boolean);

    if (textParts.length > 0) {
      return textParts.join("");
    }
  }

  return "";
}

// Render different types of message parts
function renderMessagePart(
  part: MessagePart,
  key: string | number,
  isLoading: boolean,
  isCompact: boolean,
  setPreviewAttachment: (
    attachment: { url: string; type: string; name?: string } | null
  ) => void
) {
  // If it's a string or no type specified
  if (!part || typeof part === "string") {
    return <Markdown key={key} content={part} />;
  }

  // Centralized tool part adaptation (supports tool-call, tool-result, tool-<name>, tool-invocation)
  const adapted = adaptToToolInvocationPart(part as { type?: string });
  if (adapted) {
    return (
      <ToolInvocationPart
        key={key}
        part={adapted}
        isLoading={isLoading}
        isCompact={isCompact}
      />
    );
  }

  // Handle different part types
  switch (part.type) {
    case "text":
      return <Markdown key={key} content={part.text} />;

    // tool-call/tool-result cases are covered by adaptation above

    case "tool-invocation":
      return (
        <ToolInvocationPart
          key={key}
          part={part}
          isLoading={isLoading}
          isCompact={isCompact}
        />
      );
    case "reasoning":
      return <ReasoningPart key={key} part={part} isLoading={isLoading} />;

    case "image":
      return (
        <div key={key} className="my-2">
          <button
            type="button"
            className="relative border rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() =>
              setPreviewAttachment({
                url: part.src,
                type: "image",
                name: part.alt || "Image",
              })
            }
          >
            <img
              src={part.src}
              alt={part.alt || "Image"}
              className="object-cover object-center overflow-hidden rounded-md h-full max-h-96 max-w-64 w-fit transition-opacity duration-300 opacity-100"
            />
          </button>
        </div>
      );
    case "pdf":
      return (
        <div key={key} className="my-2">
          <div className="border rounded-md overflow-hidden">
            <iframe
              src={part.src}
              className="overflow-hidden rounded-md h-full max-h-96 max-w-64 w-fit transition-opacity duration-300 opacity-100"
              title="PDF Document"
            />
          </div>
        </div>
      );
    case "text-file":
      return (
        <div key={key} className="my-2">
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted/40 mb-2">
            <IconFileText size={20} className="text-primary" />
            <div className="flex-1 truncate">
              {part.name && <p className="font-medium text-sm">{part.name}</p>}
            </div>
            <CopyButton text={part.content} />
          </div>
          <pre className="bg-muted/40 p-4 rounded-md overflow-x-auto">
            <code>{part.content}</code>
          </pre>
        </div>
      );
    default:
      return null;
  }
}

export function ChatMessage({
  message,
  isLoading,
  isCompact = false,
  isLastMessage = false,
  error = null,
  status = "ready",
  retry,
  regenerate,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  isEditing = false,
}: ChatMessageProps) {
  const t = useTranslations("Chat");
  const tCommon = useTranslations("Common");
  const { editMessage, isLoading: isEditLoading } = useEditMessage();
  const isUser = message.role === "user";

  // Handle edit save
  const handleEditSave = async (content: string) => {
    if (!message.id) return;

    try {
      // 使用父组件的保存函数（包含数据库保存和状态管理）
      if (onSaveEdit) {
        await onSaveEdit(message.id, content);
      } else {
        await editMessage(message.id, content);
        if (onCancelEdit) {
          onCancelEdit();
        }
      }
    } catch (error) {
      console.error("Failed to save edited message:", error);
      throw error;
    }
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    if (onCancelEdit) {
      onCancelEdit();
    }
  };
  const [previewAttachment, setPreviewAttachment] = useState<{
    url: string;
    type: string;
    name?: string;
  } | null>(null);

  // Handle message content display
  const renderContent = () => {
    // If message has parts array
    if (message.parts && Array.isArray(message.parts)) {
      // Filter out parts that would render as null (like step-start)
      const validParts = message.parts.map((part, index) => {
        const convertedPart = part as MessagePart;
        const partLoading =
          isLoading && !isUser && index === (message.parts?.length ?? 0) - 1;
        return renderMessagePart(
          convertedPart,
          `message-part-${index}`,
          partLoading,
          isCompact,
          setPreviewAttachment
        );
      });

      // If we have valid parts, render them
      if (validParts.length > 0) {
        return validParts;
      }
    }

    // If only has regular content, or if parts are empty during streaming
    const content = getMessageContent(message);
    if (content && content.trim().length > 0) {
      return <Markdown content={content} />;
    }

    // If we're loading and there's no content yet, show a loading indicator
    if (isLoading && !isUser) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Spinner className="h-4 w-4" />
          <span>Thinking...</span>
        </div>
      );
    }

    return null;
  };

  // Render attachments if present
  const renderAttachments = () => {
    const m = message as unknown as MaybeAttachmentsMessage;
    const attachments: Attachment[] =
      m.experimental_attachments || m.attachments || [];
    if (!attachments || attachments.length === 0) {
      return null;
    }

    return (
      <div className="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2">
        {attachments.map((attachment: Attachment) => {
          const uniqueKey = `${message.id}-${attachment.name || ""}-${
            attachment.url
          }`;

          if (attachment.contentType?.startsWith("image/")) {
            return (
              <button
                key={uniqueKey}
                type="button"
                className="border rounded-md overflow-hidden group relative cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() =>
                  setPreviewAttachment({
                    url: attachment.url,
                    type: attachment.contentType || "",
                    name: attachment.name || "Image Attachment",
                  })
                }
                aria-label={`Preview image: ${
                  attachment.name || "Image attachment"
                }`}
              >
                <div className="relative w-full h-full">
                  <img
                    src={attachment.url}
                    alt={attachment.name || "Image attachment"}
                    className="object-cover object-center overflow-hidden rounded-lg h-full max-h-96 max-w-64 w-fit transition-opacity duration-300 opacity-100"
                  />
                </div>
                {attachment.name && (
                  <div className="p-2 text-xs text-center text-foreground">
                    {attachment.name}
                  </div>
                )}
              </button>
            );
          }

          if (attachment.contentType?.startsWith("application/pdf")) {
            return (
              <button
                key={uniqueKey}
                type="button"
                onClick={() =>
                  setPreviewAttachment({
                    url: attachment.url,
                    type: attachment.contentType || "application/pdf",
                    name: attachment.name,
                  })
                }
                className="border rounded-md overflow-hidden group relative hover:shadow-md transition-shadow cursor-pointer bg-gray-50 dark:bg-gray-800"
              >
                <div className="relative p-6 flex flex-col items-center justify-center min-h-[120px] w-48">
                  <div className="text-4xl mb-2">📄</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    PDF 文档
                  </div>
                </div>
                {attachment.name && (
                  <div className="p-2 text-xs text-center text-foreground border-t border-gray-200 dark:border-gray-700">
                    {attachment.name}
                  </div>
                )}
              </button>
            );
          }

          // For other file types show a file icon with name
          return (
            <div
              key={uniqueKey}
              className="flex items-center gap-2 p-3 rounded-md bg-muted/40"
            >
              <IconFileTypography size={20} className="text-primary" />
              <div className="flex-1 truncate">
                <p className="font-medium text-sm">
                  {attachment.name || "File attachment"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {attachment.contentType}
                </p>
              </div>
              <a
                href={attachment.url}
                download={attachment.name}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-muted/80 hover:bg-muted rounded-full p-2 inline-flex items-center justify-center"
                title={`Download ${attachment.name || "file"}`}
                aria-label={`Download ${attachment.name || "file"}`}
              >
                <IconDownload className="h-4 w-4" />
              </a>
            </div>
          );
        })}
      </div>
    );
  };

  // Get message content for copying
  const getMessageContentForCopy = () => {
    const msgWith = message as unknown as MaybeContentMessage &
      MaybePartsMessage;
    if (typeof msgWith.content !== "undefined") {
      const c = msgWith.content;
      if (typeof c === "string") return c;
      try {
        return JSON.stringify(c);
      } catch {
        return String(c);
      }
    }

    if (Array.isArray(msgWith.parts)) {
      const textParts = msgWith.parts
        .filter((part): part is { type?: string; text?: string } =>
          Boolean(part)
        )
        .filter((part) => part.type === "text" && typeof part.text === "string")
        .map((part) => part.text as string)
        .filter(Boolean);

      if (textParts.length > 0) {
        return textParts.join("");
      }
    }

    return "";
  };

  // Check if there's any actual content to render
  const content = renderContent();
  const hasContent = content !== null && content !== undefined;

  return hasContent ? (
    <>
      <ChatItem
        isUser={isUser}
        isCompact={isCompact}
        isLastMessage={isLastMessage}
        error={error}
        status={status}
        retry={retry}
        regenerate={regenerate}
        messageContent={getMessageContentForCopy()}
        messageId={message.id}
        onEdit={onEdit}
        isEditing={isEditing}
      >
        {isLoading && !isUser && (
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <Spinner variant="ellipsis" />
          </div>
        )}
        {/* Error indicator for failed messages */}
        {isLastMessage && error && status === "error" && (
          <div className="flex items-center gap-2 mb-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 px-2 py-1 rounded-md border border-red-200 dark:border-red-800">
            <IconAlertCircle className="w-3 h-3" />
            <span>消息发送失败</span>
          </div>
        )}
        {renderAttachments()}

        {/* Conditional rendering: MessageEditor for editing, normal content otherwise */}
        {isEditing && isUser ? (
          <MessageEditor
            initialContent={getMessageContentForCopy()}
            onSave={handleEditSave}
            onCancel={handleEditCancel}
            isLoading={isEditLoading}
            className="mt-2"
          />
        ) : (
          <div
            className={cn(
              "transition-all duration-200",
              isEditing && "opacity-50 pointer-events-none"
            )}
          >
            {content}
          </div>
        )}
      </ChatItem>

      <FilePreviewDialog
        isOpen={
          !!previewAttachment &&
          (previewAttachment.type === "application/pdf" ||
            previewAttachment?.type.startsWith("image/"))
        }
        onClose={() => setPreviewAttachment(null)}
        fileUrl={previewAttachment?.url || ""}
        fileName={previewAttachment?.name}
        fileType={previewAttachment?.type || ""}
      />
    </>
  ) : null;
}
