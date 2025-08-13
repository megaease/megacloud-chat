"use client";

import { Loader } from "@/components/prompt-kit/loader";
import { MessageContent } from "@/components/prompt-kit/message";
import { Tool } from "@/components/prompt-kit/tool";
import { FilePreviewDialog } from "@/components/ui/file-preview-dialog";
import { useEditMessage } from "@/hooks/use-edit-message";
import { cn } from "@/lib/utils";
import type { ReasoningPart as ReasoningPartType } from "@/types/tool-invocation";
import {
  IconAlertCircle,
  IconDownload,
  IconFileText,
  IconFileTypography,
} from "@tabler/icons-react";
import type { UIMessage } from "ai";
import { useState } from "react";
import { CopyButton } from "../copy-button";
// (no explicit MessagePart import; we operate on unknown with runtime guards)
import { ChatItem } from "./chat-item";
import { MessageEditor } from "./message-editor";
import { ReasoningPart } from "./reasoning-part";

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

// Note: message rendering strictly relies on message.parts per new format.

// 生成稳定的分片 key
function getPartKey(part: unknown): string {
  try {
    const str = JSON.stringify(part);
    return str ?? "unknown";
  } catch {
    // 退化为使用对象引用字符串
    return String(part);
  }
}

// 渲染非工具的富媒体分片
function renderRichPart(
  part: unknown,
  key: string | number,
  setPreviewAttachment: (
    attachment: { url: string; type: string; name?: string } | null
  ) => void,
  isLoading: boolean,
  status?: "error" | "submitted" | "streaming" | "ready"
) {
  const p = part as { type?: string } | null | undefined;
  const type = p?.type;
  switch (type) {
    case "image":
      return (
        <div key={key} className="my-2">
          <button
            type="button"
            className="relative border rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() =>
              setPreviewAttachment({
                url: (part as { src: string }).src,
                type: "image",
                name: (part as { alt?: string }).alt || "Image",
              })
            }
          >
            <img
              src={(part as { src: string }).src}
              alt={(part as { alt?: string }).alt || "Image"}
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
              src={(part as { src: string }).src}
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
              {(part as { name?: string }).name && (
                <p className="font-medium text-sm">
                  {(part as { name?: string }).name}
                </p>
              )}
            </div>
            <CopyButton text={(part as { content: string }).content} />
          </div>
          <pre className="bg-muted/40 p-4 rounded-md overflow-x-auto">
            <code>{(part as { content: string }).content}</code>
          </pre>
        </div>
      );
    case "reasoning":
      return (
        <div key={key} className="my-3">
          <ReasoningPart
            part={part as unknown as ReasoningPartType}
            isStreaming={status === "streaming"}
          />
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
    const parts = (message as { parts?: Array<Record<string, unknown>> }).parts;
    if (!Array.isArray(parts) || parts.length === 0) return null;
    return (
      <>
        {/* 顺序遍历所有分片，按类型渲染（严格保持顺序） */}
        {parts.map((part, idx) => {
          const t = (part as { type?: string }).type;
          const key = `${message.id}-part-${idx}-${t || "unknown"}`;

          if (t === "file") {
            const f = part as {
              type: string;
              url: string;
              name?: string;
              mediaType?: string;
              filename?: string;
            };
            const contentType = f.mediaType || "";
            const fileName = f.name || f.filename || "file";

            if (contentType.startsWith("image/")) {
              return (
                <div key={key} className="my-3">
                  <button
                    type="button"
                    className="border rounded-md overflow-hidden group relative cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() =>
                      setPreviewAttachment({
                        url: f.url,
                        type: contentType,
                        name: fileName,
                      })
                    }
                    aria-label={`Preview image: ${fileName}`}
                  >
                    <img
                      src={f.url}
                      alt={fileName}
                      className="object-cover object-center overflow-hidden rounded-lg h-full max-h-96 max-w-64 w-fit"
                    />
                  </button>
                </div>
              );
            }

            if (contentType.startsWith("application/pdf")) {
              return (
                <div key={key} className="my-3">
                  <button
                    type="button"
                    className="border rounded-md overflow-hidden group relative hover:shadow-md transition-shadow cursor-pointer grabg-y-50 dark:bg-gray-800 p-3 text-xs"
                    onClick={() =>
                      setPreviewAttachment({
                        url: f.url,
                        type: contentType,
                        name: fileName,
                      })
                    }
                  >
                    📄 {fileName}
                  </button>
                </div>
              );
            }

            return (
              <div key={key} className="my-3">
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40 text-xs">
                  <IconFileTypography size={16} className="text-primary" />
                  <span className="truncate max-w-40" title={fileName}>
                    {fileName}
                  </span>
                </div>
              </div>
            );
          }
          if (t === "text") {
            const text = (part as { text?: string }).text || "";
            return text ? (
              <MessageContent
                key={key}
                markdown
                className={
                  isUser
                    ? "p-4 rounded-md text-end w-fit"
                    : "bg-transparent p-0 "
                }
              >
                {text}
              </MessageContent>
            ) : null;
          }
          if (t === "reasoning") {
            return (
              <div key={key} className="my-3">
                <ReasoningPart
                  part={part as unknown as ReasoningPartType}
                  isStreaming={status === "streaming"}
                />
              </div>
            );
          }
          // 使用 prompt-kit 的 <Tool> 展示 AI SDK 5 工具调用
          if (t === "dynamic-tool") {
            return (
              <div key={key} className="my-3">
                <Tool
                  toolPart={part as Record<string, unknown>}
                  isLoading={isLoading}
                  compact={isCompact}
                  className="w-full"
                />
              </div>
            );
          }

          // 支持 tool-createDocument, tool-updateDocument 等格式
          if (t?.startsWith("tool-")) {
            return (
              <div key={key} className="my-3">
                <Tool
                  toolPart={part as Record<string, unknown>}
                  isLoading={isLoading}
                  compact={isCompact}
                  className="w-full"
                />
              </div>
            );
          }

          // 其它富媒体分片
          const rich = renderRichPart(
            part,
            key,
            setPreviewAttachment,
            isLoading && !isUser,
            status
          );
          if (rich) return rich;

          // 跳过未知类型的分片
          return null;
        })}
      </>
    );
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
        {(status === "submitted" || status === "streaming") && !isUser && (
          <div className="flex items-center gap-2 mb-2 text-xs text-foreground justify-start">
            {status === "streaming" ? (
              <Loader
                variant="dots"
                size="md"
                className="[&>div]:!bg-foreground"
              />
            ) : status === "submitted" ? (
              <Loader variant="text-shimmer" size="sm" text="正在处理..." />
            ) : (
              <Loader variant="text-shimmer" size="sm" text="正在处理..." />
            )}
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
