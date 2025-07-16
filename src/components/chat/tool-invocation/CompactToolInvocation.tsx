import { motion } from "framer-motion";
import {
  IconChevronDown,
  IconExternalLink,
  IconFileText,
  IconCode,
  IconTable,
  IconPhoto,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useDocumentToolAction } from "@/hooks/useDocumentToolAction";
import type { ToolState, ToolStatus, ToolTheme } from "./types";
import type {
  ResultContent,
  ToolInvocationPart,
} from "@/types/tool-invocation";

interface CompactToolInvocationProps {
  toolState: ToolState;
  status: ToolStatus;
  theme: ToolTheme;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onOpenArtifact?: (documentId: string, boundingBox: { top: number; left: number; width: number; height: number }) => void;
  isCompact?: boolean; // 新增：是否为紧凑模式
  part?: ToolInvocationPart; // 添加 part 参数以访问工具调用结果
}

const getDocumentIcon = (kind?: string) => {
  switch (kind) {
    case "code":
      return IconCode;
    case "sheet":
      return IconTable;
    case "image":
      return IconPhoto;
    default:
      return IconFileText;
  }
};

// 渲染工具调用结果
const renderResult = (
  result: Array<ResultContent | string> | string | null,
  isCompact = false
) => {
  if (!result) return null;

  // 如果结果是数组
  if (Array.isArray(result)) {
    return result.map((item, index) => {
      const key = `result-${
        typeof item === "string"
          ? item.slice(0, 20)
          : item.text?.slice(0, 20) || "item"
      }-${index}`;

      if (typeof item === "string") {
        return (
          <div
            key={key}
            className={cn(
              "text-xs font-mono whitespace-pre-wrap break-words",
              isCompact
                ? "max-h-20 overflow-y-auto"
                : "max-h-32 overflow-y-auto"
            )}
          >
            {item}
          </div>
        );
      }
      if (item.type === "text") {
        return (
          <div
            key={key}
            className={cn(
              "text-xs whitespace-pre-wrap break-words",
              isCompact
                ? "max-h-20 overflow-y-auto"
                : "max-h-32 overflow-y-auto"
            )}
          >
            {item.text}
          </div>
        );
      }
      if (item.type === "code") {
        return (
          <div
            key={key}
            className={cn(
              "text-xs font-mono whitespace-pre-wrap break-words bg-gray-100 dark:bg-gray-800 rounded p-2",
              isCompact
                ? "max-h-20 overflow-y-auto"
                : "max-h-32 overflow-y-auto"
            )}
          >
            {item.text}
          </div>
        );
      }
      if (item.type === "markdown") {
        return (
          <div
            key={key}
            className={cn(
              "text-xs whitespace-pre-wrap break-words",
              isCompact
                ? "max-h-20 overflow-y-auto"
                : "max-h-32 overflow-y-auto"
            )}
          >
            {item.text}
          </div>
        );
      }
      return null;
    });
  }

  // 如果结果是字符串
  if (typeof result === "string") {
    return (
      <div
        className={cn(
          "text-xs font-mono whitespace-pre-wrap break-words",
          isCompact ? "max-h-20 overflow-y-auto" : "max-h-32 overflow-y-auto"
        )}
      >
        {result}
      </div>
    );
  }

  return null;
};

export function CompactToolInvocation({
  toolState,
  status,
  theme,
  isExpanded,
  onToggleExpanded,
  onOpenArtifact,
  isCompact = false,
  part,
}: CompactToolInvocationProps) {
  const { handleDocumentClick, canOpenArtifact: canOpenDoc, extractDocumentInfo } = useDocumentToolAction();
  
  const args = (toolState.args || {}) as {
    title?: string;
    content?: string;
    kind?: string;
    documentId?: string;
  };

  // 从工具结果中提取版本信息
  const documentInfo = extractDocumentInfo(part);
  const resultVersion = documentInfo?.version;

  // 检查是否可以打开 artifact
  const canOpenArtifact = canOpenDoc(part, args, status);

  // 处理文档点击事件
  const handleOpenArtifact = () => {
    if (!canOpenArtifact) return;
    
    const boundingBox = {
      top: window.innerHeight / 2 - 100,
      left: window.innerWidth / 2 - 200,
      width: 400,
      height: 200,
    };

    handleDocumentClick(part, args, boundingBox);
  };

  // For document tools, display a more compact card style
  if (
    toolState.isDocumentTool &&
    (status === "success" || status === "executing")
  ) {
    const IconComponent = getDocumentIcon(args.kind);

    // Determine if this is an update or create based on documentId
    const isUpdate = !!args.documentId;
    const executingTitle = isUpdate
      ? "Updating Document..."
      : "Creating Document...";

    // 从工具结果中获取标题（如果可用）
    const getResultTitle = () => {
      if (part?.toolInvocation?.result) {
        const toolResult = part.toolInvocation.result;
        // 工具返回的结果格式：{ documentId, title, kind, language, success }
        if (typeof toolResult === "object" && "title" in toolResult) {
          return (toolResult as Record<string, unknown>).title as string;
        }
      }
      return null;
    };

    const resultTitle = getResultTitle();
    const actualTitle = args.title || resultTitle;

    // 简化显示逻辑：第一行始终显示标题，第二行始终显示工具名称
    const title =
      actualTitle || (isUpdate ? "Updating Document" : "Creating Document");
    const subtitle = toolState.toolName;

    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "my-3 rounded-lg border overflow-hidden transition-colors",
          status === "executing"
            ? "border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/80 to-orange-50/60 dark:from-amber-950/40 dark:to-orange-950/30"
            : "border-blue-200/60 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30",
          canOpenArtifact &&
            "cursor-pointer hover:border-blue-300/80 dark:hover:border-blue-700/60"
        )}
        onClick={handleOpenArtifact}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpenArtifact();
          }
        }}
        aria-label={canOpenArtifact ? `Open document: ${title}` : undefined}
      >
        {/* Compact document header */}
        <div className="flex items-center gap-3 p-3 relative">
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-md text-white flex-shrink-0",
              status === "executing" ? "bg-amber-500" : "bg-blue-500"
            )}
          >
            {status === "executing" ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <IconComponent size={16} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {title}
              </div>
              {/* 简洁明显的版本号显示 */}
              {resultVersion && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50 flex-shrink-0">
                  v{resultVersion}
                </span>
              )}
            </div>
            <div
              className={cn(
                "text-xs mt-0.5",
                status === "executing"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-gray-600 dark:text-gray-400"
              )}
            >
              {subtitle}
            </div>
          </div>
          {/* Small icon indicator in top right */}
        </div>
      </motion.div>
    );
  }

  // For regular tool invocations, display a concise row style
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-md border overflow-hidden",
        isCompact ? "my-1" : "my-2",
        theme.borderColor,
        theme.backgroundColor
      )}
    >
      {/* Compact tool header */}
      <div
        className={cn(
          "flex items-center cursor-pointer transition-colors",
          isCompact ? "gap-1.5 px-2 py-1.5" : "gap-2 px-3 py-2",
          theme.hoverBackgroundColor
        )}
        onClick={onToggleExpanded}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpanded();
          }
        }}
      >
        {/* Tool icon */}
        <div
          className={cn(
            "flex items-center justify-center rounded flex-shrink-0 text-white text-xs font-medium",
            isCompact ? "w-4 h-4" : "w-5 h-5",
            status === "success"
              ? "bg-blue-500"
              : status === "error"
              ? "bg-red-500"
              : status === "executing"
              ? "bg-amber-500"
              : "bg-gray-500"
          )}
        >
          {status === "success"
            ? "✓"
            : status === "error"
            ? "✗"
            : status === "executing"
            ? "⋯"
            : "⋅"}
        </div>

        {/* Tool name and status */}
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div className="flex-1 min-w-0 flex items-center">
            <span
              className={cn(
                "font-medium text-gray-900 dark:text-gray-100 truncate",
                isCompact ? "text-xs" : "text-sm"
              )}
            >
              {toolState.toolName}
            </span>
            <span
              className={cn(
                "text-gray-400 flex-shrink-0",
                isCompact ? "mx-1" : "mx-2"
              )}
            >
              →
            </span>
          </div>
          <span
            className={cn(
              "flex-shrink-0",
              isCompact ? "text-xs" : "text-sm",
              status === "executing"
                ? "text-amber-600 dark:text-amber-400"
                : status === "success"
                ? "text-blue-600 dark:text-blue-400"
                : status === "error"
                ? "text-red-600 dark:text-red-400"
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            {status === "executing"
              ? "Executing..."
              : status === "success"
              ? "Completed"
              : status === "error"
              ? "Failed"
              : "Completed"}
          </span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {status === "executing" && (
            <div
              className={cn(
                "rounded-full bg-amber-500 animate-pulse",
                isCompact ? "w-1.5 h-1.5" : "w-2 h-2"
              )}
            />
          )}
          {(status === "success" || status === "error") && (
            <IconChevronDown
              size={isCompact ? 10 : 12}
              className={cn(
                "transition-transform text-gray-400",
                isExpanded && "rotate-180"
              )}
            />
          )}
        </div>
      </div>

      {/* Expandable content area (compact version) */}
      {isExpanded && (status === "success" || status === "error") && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-gray-200/50 dark:border-gray-700/50"
        >
          <div
            className={cn(
              "bg-gray-50/30 dark:bg-gray-900/10",
              isCompact ? "px-2 py-1.5" : "px-3 py-2"
            )}
          >
            {/* Error message */}
            {toolState.hasError && toolState.errorMessage && (
              <div
                className={cn(
                  "bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800/40",
                  isCompact ? "mb-1.5 p-1.5" : "mb-2 p-2"
                )}
              >
                <div className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">
                  Error
                </div>
                <div className="text-xs text-red-700 dark:text-red-300 font-mono">
                  {toolState.errorMessage}
                </div>
              </div>
            )}

            {/* Result display */}
            {toolState.result && status === "success" && (
              <div className={cn(isCompact ? "mb-1.5" : "mb-2")}>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Result
                </div>
                <div className="bg-white dark:bg-gray-900/40 rounded border px-2 py-1 text-gray-600 dark:text-gray-400">
                  {renderResult(toolState.result, isCompact)}
                </div>
              </div>
            )}

            {/* Simplified parameter display */}
            {Object.keys(toolState.args).length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Parameters
                </div>
                <div
                  className={cn(
                    "bg-white dark:bg-gray-900/40 rounded border font-mono text-gray-600 dark:text-gray-400",
                    isCompact
                      ? "px-1.5 py-1 text-xs max-h-16 overflow-y-auto"
                      : "px-2 py-1 text-xs"
                  )}
                >
                  {JSON.stringify(toolState.args, null, isCompact ? 1 : 2)}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
