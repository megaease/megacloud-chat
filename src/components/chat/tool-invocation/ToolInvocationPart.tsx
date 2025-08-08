import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useArtifact } from "@/context/artifact-provider-context";
import { ToolExecutionStatus } from "./ToolExecutionStatus";
import { DocumentToolInvocation } from "./DocumentToolInvocation";
import { CompactToolInvocation } from "./CompactToolInvocation";
import { useToolInvocationState } from "./hooks";
import { TOOL_THEMES } from "./types";
import type { ToolInvocationProps } from "./types";

/**
 * ToolInvocationPart - 工具调用部分的核心组件
 *
 * 主要功能：
 * 1. 统一处理所有类型的工具调用展示（文档工具、普通工具）
 * 2. 管理工具调用状态（执行中、成功、失败）
 * 3. 处理 Artifact 的打开和版本切换
 * 4. 支持紧凑模式和完整模式的展示
 *
 * 工具调用状态流程：
 * - executing: 工具正在执行中，显示加载状态
 * - success: 工具执行成功，显示结果和打开按钮
 * - error: 工具执行失败，显示错误信息
 *
 * Artifact 管理：
 * - 流式创建：在工具执行过程中实时显示内容
 * - 版本切换：点击已完成的工具调用可以切换到对应版本
 * - 统一通过 artifact context 管理所有状态
 */

export function ToolInvocationPart({
  part,
  isLoading,
  isCompact = false,
}: ToolInvocationProps) {
  const { toolState, status, isExpanded, toggleExpanded } =
    useToolInvocationState(part);

  const theme = TOOL_THEMES[status];

  // 确定内容是否会被显示
  const hasExpandableContent =
    (status === "success" || status === "error") && isExpanded;

  // 如果是紧凑模式，使用专门的紧凑组件
  if (isCompact) {
    return (
      <CompactToolInvocation
        toolState={toolState}
        status={status}
        theme={theme}
        isExpanded={isExpanded}
        onToggleExpanded={toggleExpanded}
        isCompact={true}
        part={part}
      />
    );
  }

  // 如果是 document 工具，使用特殊的文档样式（无论是否成功）
  if (toolState.isDocumentTool) {
    return (
      <DocumentToolInvocation
        toolState={toolState}
        status={status}
        theme={theme}
        isLoading={isLoading || status === "executing"}
  part={part}
      />
    );
  }

  // 默认的工具调用样式（用于普通工具）- 使用简洁的单行风格
  return (
    <CompactToolInvocation
      toolState={toolState}
      status={status}
      theme={theme}
      isExpanded={isExpanded}
      onToggleExpanded={toggleExpanded}
      isCompact={false}
  part={part}
    />
  );
}
