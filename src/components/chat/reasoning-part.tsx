"use client";

import type { ReasoningPart as ReasoningPartType } from "@/types/tool-invocation";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/prompt-kit/reasoning";

export function ReasoningPart({
  part,
  isLoading,
}: {
  part: ReasoningPartType;
  isLoading: boolean;
}) {
  return (
    <Reasoning isStreaming={isLoading}>
      <ReasoningTrigger />
      <ReasoningContent markdown>{part.reasoningText}</ReasoningContent>
    </Reasoning>
  );
}
