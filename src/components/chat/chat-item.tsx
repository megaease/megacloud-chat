import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

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

  // Render action buttons
  const renderActionButtons = () => {
    // Always show copy button for all messages
    const showCopyButton = true;

    // Only show edit button for user messages (not during editing)
    const showEditButton = isUser && messageId && onEdit && !isEditing;

    // Only show retry/regenerate buttons for the last message when request is complete
    const showRetryButton =
      isLastMessage && isUser && error && status === "error" && retry;
    const showRegenerateButton =
      isLastMessage && !isUser && !error && status === "ready" && regenerate;

    // For non-last messages, only show copy and edit buttons
    // For last message, check if streaming/submitted to hide all buttons temporarily
    if (isLastMessage && (status === "streaming" || status === "submitted")) {
      return null; // Hide all buttons during streaming
    }

    if (
      !showRetryButton &&
      !showRegenerateButton &&
      !showCopyButton &&
      !showEditButton
    )
      return null;

    return (
      <TooltipProvider>
        <div
          className={cn(
            "flex gap-1 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            isUser ? "justify-end" : "justify-start pl-4"
          )}
        >
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied ? t("copied") : t("copy")}</p>
              </TooltipContent>
            </Tooltip>
            {showEditButton && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="h-6 w-6 p-0 hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-md"
                  >
                    <IconEdit className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("edit")}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {showRetryButton && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={retry}
                    className="h-6 w-6 p-0 hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-md"
                  >
                    <IconRefresh className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("retry")}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {showRegenerateButton && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={regenerate}
                    className="h-6 w-6 p-0 hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-md"
                  >
                    <IconReload className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tArtifact("regenerate")}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </TooltipProvider>
    );
  };

  // Determine if this message has an error
  const hasError = isLastMessage && error && status === "error";

  return (
    <div
      className={cn(
        "group flex gap-4 text-sm py-4",
        isUser ? "flex-row-reverse pr-1" : "pl-1",
        isCompact && isUser && "gap-0 pr-0"
      )}
    >
      {!isUser ? (
        <Avatar
          className={cn(
            "mt-0.5 h-8 w-8 flex-shrink-0 shadow-[var(--shadow-xs)]",
            // 在紧凑模式下隐藏用户头像
            isCompact && isUser && "hidden"
          )}
        >
          <AvatarFallback
            className={cn(
              "rounded-[var(--radius)]",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {isUser ? "U" : "AI"}
          </AvatarFallback>
        </Avatar>
      ) : null}
      <div
        className={cn(
          "flex-1 space-y-2 min-w-0", // 添加 min-w-0 防止内容溢出
          isUser ? "text-right" : "text-left",
          // 在紧凑模式下优化宽度处理
          isCompact ? (isUser ? "max-w-full" : "max-w-full") : "max-w-[89%]"
        )}
      >
        <div
          className={cn(
            "rounded-[var(--radius)] px-4 py-3 text-left min-w-0 transition-all duration-200", // 添加 min-w-0 和过渡动画
            // 在紧凑模式下优化显示
            isCompact
              ? isUser
                ? hasError
                  ? "inline-block bg-red-100 dark:bg-red-950/30 text-red-900 dark:text-red-100 border border-red-300 dark:border-red-800 shadow-[var(--shadow-xs)] max-w-full break-words"
                  : "inline-block bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300  max-w-full break-words"
                : "block bg-transparent text-card-foreground w-full overflow-hidden"
              : isUser
              ? hasError
                ? "inline-block bg-red-100 dark:bg-red-950/30 text-red-900 dark:text-red-100 border border-red-300 dark:border-red-800 shadow-[var(--shadow-xs)] w-auto"
                : "inline-block bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300  w-auto"
              : "inline-block bg-transparent text-card-foreground w-full",
            // 添加编辑状态的视觉反馈
            isEditing && [
              "ring-2 ring-blue-500 ring-opacity-50",
              "bg-blue-50/50 dark:bg-blue-950/20",
              "border-blue-200 dark:border-blue-800",
              "shadow-lg",
              "scale-[1.02]",
            ],
            // 添加链接样式修复
            "[&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-2",
            // 为用户消息中的链接使用对比色
            isUser
              ? "[&_a]:text-primary-foreground/90 [&_a:hover]:text-primary-foreground"
              : "[&_a]:text-blue-600 [&_a:hover]:text-blue-800 dark:[&_a]:text-blue-400 dark:[&_a:hover]:text-blue-300"
          )}
        >
          {children}
        </div>
        {renderActionButtons()}
        {/* {message.createdAt && (
                <div className="text-xs text-muted-foreground px-2 mt-2">
                    {new Date(message.createdAt).toLocaleTimeString()}
                </div>
            )} */}
      </div>
    </div>
  );
}
