import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { IconCopy, IconRefresh, IconReload } from "@tabler/icons-react";
import { toast } from "sonner";
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
}: ChatItemProps) {
  // Render action buttons for last message
  const renderActionButtons = () => {
    if (!isLastMessage) return null;

    // Only show buttons when the request is complete (not streaming)
    if (status === "streaming" || status === "submitted") return null;

    const showRetryButton = isUser && error && status === "error" && retry;
    const showRegenerateButton =
      !isUser && !error && status === "ready" && regenerate;
    const showCopyButton = true; // Always show copy button for completed messages

    if (!showRetryButton && !showRegenerateButton && !showCopyButton)
      return null;

    const handleCopy = async () => {
      try {
        const content = messageContent || "";
        await navigator.clipboard.writeText(content);
        toast.success("已复制到剪贴板");
      } catch (err) {
        console.error("Failed to copy text: ", err);
        toast.error("复制失败");
      }
    };

    return (
      <TooltipProvider>
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 w-6 p-0 hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-md"
              >
                <IconCopy className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>复制</p>
            </TooltipContent>
          </Tooltip>
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
                <p>重试</p>
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
                <p>重新生成</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  };

  return (
    <div
      className={cn(
        "flex gap-4 text-sm py-4",
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
            "rounded-[var(--radius)] px-4 py-3 text-left min-w-0", // 添加 min-w-0
            // 在紧凑模式下优化显示
            isCompact
              ? isUser
                ? "inline-block bg-primary text-primary-foreground shadow-[var(--shadow-xs)] max-w-full break-words"
                : "block bg-transparent text-card-foreground w-full overflow-hidden"
              : isUser
              ? "inline-block bg-primary text-primary-foreground shadow-[var(--shadow-xs)] w-auto"
              : "inline-block bg-transparent text-card-foreground w-full",
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
