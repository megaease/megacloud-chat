import { ModernDocumentTool } from "@/components/chat/ModernDocumentTool";
import { Tool as PromptKitTool } from "@/components/ui/tool";
import type { ToolPart as PromptKitToolPart } from "@/components/ui/tool";
import { cn } from "@/lib/utils";
import type {
  ToolInvocationPart as ToolInvocationPartType,
  ToolInvocationResult,
} from "@/types/tool-invocation";
import React from "react";

// AI SDK 5 dynamic-tool type
type DynamicToolPart = {
  type: "dynamic-tool";
  toolName: string;
  toolCallId: string;
  state: string;
  input?: unknown;
  output?: unknown;
};

// A lightweight ToolPart type to match usage in demos and allow flexible inputs
export type ToolPart =
  | DynamicToolPart
  | ToolInvocationPartType
  | {
      type?: string;
      // allow arbitrary properties
      [key: string]: unknown;
    };

export type ToolProps = {
  toolPart: ToolPart;
  isLoading?: boolean;
  compact?: boolean;
  className?: string;
  defaultOpen?: boolean;
};

function mapAISDK5StateToPromptKit(
  state?: string
): "input-streaming" | "input-available" | "output-available" | "output-error" {
  switch (state) {
    case "output-available":
      return "output-available";
    case "input-available":
    case "call-created":
    case "created":
      return "input-available";
    case "input-streaming":
    case "partial-call":
      return "input-streaming";
    case "processing":
    case "running":
    case "executing":
      return "input-streaming";
    case "error":
    case "failed":
      return "output-error";
    default:
      return "input-available";
  }
}

function normalizeArgs(input: unknown): Record<string, unknown> {
  return input && typeof input === "object"
    ? (input as Record<string, unknown>)
    : {};
}

function isDocumentTool(toolName: string): boolean {
  return (
    toolName === "createArtifactTool" ||
    toolName === "updateArtifactTool" ||
    toolName === "createReactAppTool"
  );
}

/**
 * Tool (prompt-kit)
 * Uses the official prompt-kit Tool component with special handling for document tools
 */
export function Tool({
  toolPart,
  isLoading = false,
  compact = false,
  className,
  defaultOpen = false,
}: ToolProps) {
  // Normalize different tool formats to a common structure
  let normalizedTool: DynamicToolPart | null = null;

  // AI SDK 5 dynamic-tool format
  if (
    typeof toolPart === "object" &&
    toolPart !== null &&
    "type" in toolPart &&
    (toolPart as { type?: string }).type === "dynamic-tool"
  ) {
    normalizedTool = toolPart as DynamicToolPart;
  }
  // Support for tool-createDocument and tool-updateDocument format
  else if (
    typeof toolPart === "object" &&
    toolPart !== null &&
    "type" in toolPart &&
    (toolPart as { type?: string }).type?.startsWith("tool-")
  ) {
    const toolType = (toolPart as { type?: string }).type as string;
    const toolName = toolType.replace("tool-", "");

    // Convert to dynamic-tool format
    normalizedTool = {
      type: "dynamic-tool",
      toolName: toolName,
      toolCallId:
        (toolPart as { toolCallId?: string }).toolCallId ||
        `auto-${Date.now()}`,
      state: (toolPart as { state?: string }).state || "output-available",
      input: (toolPart as { input?: unknown }).input,
      output: (toolPart as { output?: unknown }).output,
    };
  }
  // Legacy tool-invocation format
  else if (
    typeof toolPart === "object" &&
    toolPart !== null &&
    "type" in toolPart &&
    (toolPart as { type?: string }).type === "tool-invocation"
  ) {
    const legacyTool = toolPart as ToolInvocationPartType;
    const toolInvocation = legacyTool.toolInvocation;

    // Convert legacy state to AI SDK 5 state
    let state = "input-available";
    switch (toolInvocation.state) {
      case "result":
        state = "output-available";
        break;
      case "call":
        state = "input-available";
        break;
      case "partial-call":
        state = "input-streaming";
        break;
      case "processing":
        state = "input-streaming";
        break;
    }

    normalizedTool = {
      type: "dynamic-tool",
      toolName: toolInvocation.toolName,
      toolCallId: `legacy-${Date.now()}`,
      state: state,
      input: toolInvocation.args,
      output: toolInvocation.result,
    };
  }

  // If we have a normalized tool, render it
  if (normalizedTool) {
    // Use special document tool component for document operations
    if (isDocumentTool(normalizedTool.toolName)) {
      return (
        <div className={cn("w-full", className)}>
          <ModernDocumentTool
            part={normalizedTool}
            isLoading={isLoading}
            compact={compact}
          />
        </div>
      );
    }

    // For non-document tools, use the official prompt-kit Tool component
    const promptKitToolPart: PromptKitToolPart = {
      type: normalizedTool.toolName,
      state: mapAISDK5StateToPromptKit(normalizedTool.state),
      input: normalizeArgs(normalizedTool.input),
      output:
        normalizedTool.output && typeof normalizedTool.output === "object"
          ? (normalizedTool.output as Record<string, unknown>)
          : undefined,
      toolCallId: normalizedTool.toolCallId,
    };

    return (
      <div className={className}>
        <PromptKitTool toolPart={promptKitToolPart} defaultOpen={defaultOpen} />
      </div>
    );
  }

  return null;
}

export default Tool;
