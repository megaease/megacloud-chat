// components/artifact/DataStreamHandler.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import type { UIMessage } from "ai";
import type { ToolInvocationPart } from "@/types/tool-invocation";
import { useDocumentToolAction } from "@/hooks/useDocumentToolAction";
import {
  adaptToToolInvocationPart,
  extractDocumentInfoFromPart,
} from "@/lib/ai/tool-part-utils";

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
export function DataStreamHandler({
  chatId,
  messages = [],
}: DataStreamHandlerProps) {
  const openedRef = useRef<Set<string>>(new Set());
  const { handleDocumentClick, extractDocumentInfo } = useDocumentToolAction();

  // Collect latest relevant tool parts (any kind), adapted and with extracted doc info
  const latestDocParts = useMemo(() => {
    type DocInfo = {
      key: string;
      part: ToolInvocationPart;
      documentId: string;
      version?: number;
    };
    const out: DocInfo[] = [];
    for (const m of messages) {
      if (m.role !== "assistant") continue;
      const mParts = (m.parts || []) as unknown[];
      for (const raw of mParts) {
        const adapted = adaptToToolInvocationPart(raw as { type?: string });
        if (!adapted) continue;
        const toolName = adapted.toolInvocation.toolName;
        if (toolName !== "createDocument" && toolName !== "updateDocument")
          continue;
        const info = extractDocumentInfoFromPart(raw as { type?: string });
        const documentId = info?.documentId;
        if (!documentId) continue;
        const version = info?.version;
        const key = `${documentId}:${version ?? "latest"}`;
        out.push({ key, part: adapted, documentId, version });
      }
    }
    return out;
  }, [messages]);

  useEffect(() => {
    for (const item of latestDocParts) {
      const { key, part: adapted, documentId: docId, version } = item;
      if (openedRef.current.has(key)) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.debug("[Artifact] skip duplicate open (tool)", { key });
        }
        continue;
      }

      // Open the artifact panel at the returned version (if provided)
      handleDocumentClick(adapted, undefined, {
        top: window.innerHeight / 2 - 180,
        left: window.innerWidth - 560,
        width: 520,
        height: 360,
      });
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("[Artifact] open from tool", {
          documentId: docId,
          version,
        });
      }
      openedRef.current.add(key);
    }
  }, [latestDocParts, handleDocumentClick]);

  return null;
}
