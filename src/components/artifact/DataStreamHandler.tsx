// components/artifact/DataStreamHandler.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import type { UIMessage } from "ai";
import type { ToolInvocationPart } from "@/types/tool-invocation";
import { useDocumentToolAction } from "@/hooks/useDocumentToolAction";

interface DataStreamHandlerProps {
  chatId: string;
  messages?: UIMessage[];
}

/**
 * Bridges AI SDK v5 streamed messages to Artifact UI:
 * - Watches assistant tool results
 * - When a document tool returns id/version, auto-opens the Artifact panel
 * - Debounced with a guard to avoid repeated openings
 */
export function DataStreamHandler({ chatId, messages = [] }: DataStreamHandlerProps) {
  const openedRef = useRef<Set<string>>(new Set());
  const { handleDocumentClick, extractDocumentInfo } = useDocumentToolAction();

  // Collect latest tool-invocation parts from assistant messages
  const latestToolParts = useMemo(() => {
    const parts: ToolInvocationPart[] = [];
    const isToolInvocationPart = (p: unknown): p is ToolInvocationPart => {
      return !!p && typeof p === "object" && (p as { type?: string }).type === "tool-invocation";
    };
    for (const m of messages) {
      if (m.role !== "assistant") continue;
      const mParts = (m.parts || []) as unknown[];
      for (const p of mParts) {
        if (isToolInvocationPart(p)) parts.push(p);
      }
    }
    return parts;
  }, [messages]);

  // Also capture AI SDK v5 tool-result parts and extract artifact info
  const latestAISDKToolResults = useMemo(() => {
    const results: Array<{ toolName?: string; documentId?: string; id?: string; version?: number }> = [];
    for (const m of messages) {
      if (m.role !== "assistant") continue;
      const mParts = (m.parts || []) as unknown[];
      for (const p of mParts) {
        if (!p || typeof p !== "object") continue;
        const type = (p as { type?: string }).type;
        // Support both generic v5 tool-result and named tool-* parts from other streams
        const isGenericResult = type === "tool-result";
        const isNamedTool = !!type && type.startsWith("tool-");
        if (!isGenericResult && !isNamedTool) continue;

        const toolName = isGenericResult
          ? (p as { toolName?: string }).toolName
          : type?.slice("tool-".length);
        if (!toolName || (toolName !== "createDocument" && toolName !== "updateDocument")) continue;
        const output = (p as { output?: unknown }).output;
        let payload: Record<string, unknown> | null = null;
        if (typeof output === "string") {
          try { payload = JSON.parse(output) as Record<string, unknown>; } catch { /* ignore */ }
        } else if (output && typeof output === "object") {
          payload = output as Record<string, unknown>;
        }
        if (payload) {
          results.push({
            toolName,
            documentId: (payload.documentId as string) || (payload.id as string) || undefined,
            id: (payload.id as string) || undefined,
            version: (payload.version as number) || undefined,
          });
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.debug("[Artifact][tool-result] detected", {
              toolName,
              documentId: (payload.documentId as string) || (payload.id as string),
              version: payload.version,
            });
          }
        }
      }
    }
    return results;
  }, [messages]);

  useEffect(() => {
    for (const part of latestToolParts) {
      const info = extractDocumentInfo(part);
      const docId = info?.documentId;
      const version = info?.version;
      if (!docId) continue;
      const key = `${docId}:${version ?? "latest"}`;
      if (openedRef.current.has(key)) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.debug("[Artifact] skip duplicate open (tool-invocation)", { key });
        }
        continue;
      }

      // Open the artifact panel at the returned version (if provided)
      handleDocumentClick(part, undefined, {
        top: window.innerHeight / 2 - 180,
        left: window.innerWidth - 560,
        width: 520,
        height: 360,
      });
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("[Artifact] open from tool-invocation", { documentId: docId, version });
      }
      openedRef.current.add(key);
    }
    // Fallback: open from AI SDK v5 tool-result outputs
    for (const r of latestAISDKToolResults) {
      const docId = r.documentId || r.id;
      if (!docId) continue;
      const key = `${docId}:${r.version ?? "latest"}`;
      if (openedRef.current.has(key)) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.debug("[Artifact] skip duplicate open (tool-result)", { key });
        }
        continue;
      }
      handleDocumentClick(undefined, { documentId: docId }, {
        top: window.innerHeight / 2 - 180,
        left: window.innerWidth - 560,
        width: 520,
        height: 360,
      });
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("[Artifact] open from v5 tool-result", { toolName: r.toolName, documentId: docId, version: r.version });
      }
      openedRef.current.add(key);
    }
  }, [latestToolParts, latestAISDKToolResults, extractDocumentInfo, handleDocumentClick]);

  return null;
}
