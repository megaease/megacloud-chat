import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  IconRefresh,
  IconReload,
  IconCopy,
  IconCheck,
  IconEdit,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useCopy } from "@/hooks/use-copy";
// Removed legacy Tooltip imports; MessageAction provides its own tooltip
import {
  Message,
  MessageAvatar,
  MessageActions,
  MessageAction,
  MessageContent,
} from "@/components/prompt-kit/message";

interface ChatItemProps {
  children: React.ReactNode;
  isUser: boolean;
  isCompact?: boolean;
  isLastMessage?: boolean;
  error?: Error | null;
  status?: "error" | "submitted" | "streaming" | "ready";
  retry?: () => void;
  regenerate?: () => void;
  messageContent?: string;
  messageId?: string;
  onEdit?: (messageId: string) => void;
  isEditing?: boolean;
}

export function ChatItem({
  children,
  isUser,
  isCompact = false,
  isLastMessage = false,
  error = null,
  status = "ready",
  retry,
  regenerate,
  messageContent,
  messageId,
  onEdit,
  isEditing = false,
}: ChatItemProps) {
  const t = useTranslations("Common");
  const tArtifact = useTranslations("Artifact");
  const { copied, copy } = useCopy();

  // Handle copy functionality
  const handleCopy = async () => {
    const content = messageContent || "";
    await copy(content);
  };

  // Handle edit functionality
  const handleEdit = () => {
    if (messageId && onEdit) {
      onEdit(messageId);
    }
  };

  // Legacy renderActionButtons removed; actions are rendered inline via MessageActions

  // Determine if this message has an error
  const hasError = isLastMessage && error && status === "error";

  return (
    <Message className={cn("group", isUser ? "justify-end" : "justify-start")}>
      {/* Avatar - AI messages on the left */}
      {!isUser && (
        <MessageAvatar
          src={""}
          alt={"AI"}
          fallback={"AI"}
          className={cn(
            "mt-1.5 shadow-[var(--shadow-xs)] flex-shrink-0",
            isCompact && isUser && "hidden"
          )}
        />
      )}

      {/* Content */}
      <div
        className={cn(
          "flex w-full flex-col gap-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        {children ? (
          // children 由上层（ChatMessage）按需使用 MessageContent 或其他 prompt-kit 组件渲染

          <>{children}</>
        ) : null}

        {/* Actions */}
        <MessageActions
          className={cn(
            "py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            isUser ? "justify-end" : "justify-start"
          )}
        >
          {/* Copy */}
          <MessageAction tooltip={<p>{copied ? t("copied") : t("copy")}</p>}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0 hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-md"
            >
              {copied ? (
                <IconCheck className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <IconCopy className="w-3.5 h-3.5" />
              )}
            </Button>
          </MessageAction>

          {/* Edit */}
          {isUser && messageId && onEdit && !isEditing && (
            <MessageAction tooltip={<p>{t("edit")}</p>}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-6 w-6 p-0 hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-md"
              >
                <IconEdit className="w-3.5 h-3.5" />
              </Button>
            </MessageAction>
          )}

          {/* Retry */}
          {isLastMessage && isUser && error && status === "error" && retry && (
            <MessageAction tooltip={<p>{t("retry")}</p>}>
              <Button
                variant="ghost"
                size="sm"
                onClick={retry}
                className="h-6 w-6 p-0 hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-md"
              >
                <IconRefresh className="w-3.5 h-3.5" />
              </Button>
            </MessageAction>
          )}

          {/* Regenerate */}
          {isLastMessage &&
            !isUser &&
            !error &&
            status === "ready" &&
            regenerate && (
              <MessageAction tooltip={<p>{tArtifact("regenerate")}</p>}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={regenerate}
                  className="h-6 w-6 p-0 hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-md"
                >
                  <IconReload className="w-3.5 h-3.5" />
                </Button>
              </MessageAction>
            )}
        </MessageActions>
      </div>
    </Message>
  );
}
