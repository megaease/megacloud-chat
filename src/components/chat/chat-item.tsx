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
import { Message, MessageAvatar, MessageActions, MessageAction } from "@/components/prompt-kit/message";

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
    <Message
      className={cn(
        "group text-sm py-4",
        isUser ? "flex-row-reverse pr-1" : "pl-1",
        isCompact && isUser && "gap-0 pr-0"
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <MessageAvatar
          src={""}
          alt={"AI"}
          fallback={"AI"}
          className={cn("mt-0.5 shadow-[var(--shadow-xs)]", isCompact && isUser && "hidden")}
        />
      )}

      {/* Content */}
      <div
        className={cn(
          "flex-1 space-y-2 min-w-0",
          isUser ? "text-right" : "text-left",
          isCompact ? "max-w-full" : "max-w-[89%]"
        )}
      >
        <div
          className={cn(
            "rounded-[var(--radius)] px-4 py-3 text-left min-w-0 transition-all duration-200",
            isCompact
              ? isUser
                ? hasError
                  ? "inline-block bg-red-100 dark:bg-red-950/30 text-red-900 dark:text-red-100 max-w-full break-words"
                  : "inline-block bg-white text-gray-900 dark:text-gray-900 max-w-full break-words"
                : "block bg-white text-gray-900 dark:text-gray-900 w-full overflow-hidden"
              : isUser
              ? hasError
                ? "inline-block bg-red-100 dark:bg-red-950/30 text-red-900 dark:text-red-100 w-auto"
                : "inline-block bg-white text-gray-900 dark:text-gray-900 w-auto"
              : "inline-block bg-white text-gray-900 dark:text-gray-900 w-full",
            isEditing && "bg-muted/20",
            "[&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-2 [&_a]:text-blue-600 [&_a:hover]:text-blue-800 dark:[&_a]:text-blue-700 dark:[&_a:hover]:text-blue-600"
          )}
        >
          {children}
        </div>

        {/* Actions */}
          <MessageActions className={cn("py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200", isUser ? "justify-end" : "justify-start pl-4")}>
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
            {isLastMessage && !isUser && !error && status === "ready" && regenerate && (
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
