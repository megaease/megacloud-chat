"use client";

import type { ReasoningPart as ReasoningPartType } from "@/types/tool-invocation";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ui/reasoning";

export function ReasoningPart({
  part,
  isStreaming,
}: {
  part: ReasoningPartType;
  isStreaming: boolean;
}) {
  // 使用新的 text 属性，添加空值检查
  const reasoningText = part.text || "";

  // 如果没有推理内容，就不渲染组件
  if (!reasoningText.trim()) {
    return null;
  }

  return (
    <Reasoning isStreaming={isStreaming} className="w-full">
      <ReasoningTrigger>Show AI reasoning</ReasoningTrigger>
      <ReasoningContent markdown>{reasoningText}</ReasoningContent>
    </Reasoning>
  );
}
