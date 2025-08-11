import React from "react";
import type {
  ToolInvocationPart as ToolInvocationPartType,
  ToolInvocationResult,
} from "@/types/tool-invocation";
import { ToolInvocationPart as ToolInvocationRenderer } from "@/components/chat/tool-invocation-part";
import { ModernDocumentTool } from "@/components/chat/tool-invocation/ModernDocumentTool";

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
};

function mapAISDK5State(
  state?: string
): "call" | "partial-call" | "processing" | "result" {
  switch (state) {
    case "output-available":
      return "result";
    case "input-available":
    case "call-created":
    case "created":
      return "call";
    case "input-streaming":
    case "partial-call":
      return "partial-call";
    case "processing":
    case "running":
    case "executing":
      return "processing";
    default:
      return "processing";
  }
}

function normalizeArgs(input: unknown): Record<string, unknown> {
  return input && typeof input === "object"
    ? (input as Record<string, unknown>)
    : {};
}

function isDocumentTool(toolName: string): boolean {
  return toolName === "createDocument" || toolName === "updateDocument";
}

/**
 * Tool (prompt-kit)
 * Directly renders AI SDK 5 dynamic-tool parts without adaptation layer
 */
export function Tool({
  toolPart,
  isLoading = false,
  compact = false,
}: ToolProps) {
  // Already normalized ToolInvocationPart
  if (
    typeof toolPart === "object" &&
    toolPart !== null &&
    "type" in toolPart &&
    (toolPart as { type?: string }).type === "tool-invocation"
  ) {
    return (
      <ToolInvocationRenderer
        part={toolPart as ToolInvocationPartType}
        isLoading={isLoading}
        isCompact={compact}
      />
    );
  }

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

  // If we have a normalized tool, render it
  if (normalizedTool) {
    // Use special document tool component for document operations
    if (isDocumentTool(normalizedTool.toolName)) {
      return (
        <ModernDocumentTool
          part={normalizedTool}
          isLoading={isLoading}
          compact={compact}
        />
      );
    }

    // For non-document tools, use the standard renderer
    const normalized: ToolInvocationPartType = {
      type: "tool-invocation",
      toolInvocation: {
        toolName: normalizedTool.toolName,
        args: normalizeArgs(normalizedTool.input),
        state: mapAISDK5State(normalizedTool.state),
        ...(normalizedTool.output
          ? { result: normalizedTool.output as ToolInvocationResult }
          : {}),
      },
    };

    return (
      <ToolInvocationRenderer
        part={normalized}
        isLoading={isLoading}
        isCompact={compact}
      />
    );
  }

  return null;
}

export default Tool;
