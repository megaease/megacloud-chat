// components/artifact/DataStreamHandler.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import type { UIMessage } from "ai";
import type { ToolInvocationPart } from "@/types/tool-invocation";
import { useDocumentToolAction } from "@/hooks/useDocumentToolAction";
import { useArtifact } from "@/context/artifact-provider-context";

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
  const { extractDocumentInfo } = useDocumentToolAction();
  const { loadAndShowArtifact } = useArtifact();
  const openedRef = useRef(new Set<string>());
  const lastMessageCountRef = useRef(0);
  const lastChatIdRef = useRef(chatId);
  const initialLoadRef = useRef(true);

  // 当切换聊天时，重置状态
  useEffect(() => {
    if (lastChatIdRef.current !== chatId) {
      openedRef.current.clear();
      lastMessageCountRef.current = 0;
      lastChatIdRef.current = chatId;
      initialLoadRef.current = true; // 标记为初始加载
    }
  }, [chatId]);

  // Extract tool parts that create/update documents
  const latestDocParts = useMemo((): {
    key: string;
    documentId: string;
    version?: number;
    toolName: string;
    output?: unknown;
    isNew: boolean; // 标记是否为新消息
  }[] => {
    const out: {
      key: string;
      documentId: string;
      version?: number;
      toolName: string;
      output?: unknown;
      isNew: boolean;
    }[] = [];

    // 检查是否有新消息（消息数量增加且不是初始加载）
    const isNewMessages =
      messages.length > lastMessageCountRef.current && !initialLoadRef.current;

    for (const m of messages) {
      if (m.role !== "assistant") continue;
      const mParts = (m.parts || []) as unknown[];

      for (const raw of mParts) {
        const part = raw as {
          type?: string;
          toolName?: string;
          output?: unknown;
        };

        // Process both dynamic-tool and tool-* formats
        let toolName: string | undefined;
        let output: unknown;

        if (part.type === "dynamic-tool") {
          toolName = part.toolName;
          output = part.output;
        } else if (part.type?.startsWith("tool-")) {
          toolName = part.type.replace("tool-", "");
          output = part.output;
        } else {
          continue;
        }

        if (toolName !== "createDocument" && toolName !== "updateDocument")
          continue;

        const info = extractDocumentInfo({
          type: "dynamic-tool",
          toolName: toolName,
          toolCallId: `auto-${Date.now()}`,
          state: "output-available",
          output: output,
        });
        const documentId = info?.documentId;
        if (!documentId) continue;

        const version = info?.version;
        const key = `${documentId}:${version ?? "latest"}`;
        out.push({
          key,
          documentId,
          version,
          toolName,
          output: output,
          isNew: isNewMessages,
        });
      }
    }
    return out;
  }, [messages, extractDocumentInfo]);

  useEffect(() => {
    // 如果是初始加载，更新消息计数后标记加载完成
    if (initialLoadRef.current) {
      lastMessageCountRef.current = messages.length;
      initialLoadRef.current = false;
      return; // 初始加载时不自动打开任何 artifact
    }

    // 更新消息计数
    lastMessageCountRef.current = messages.length;

    for (const item of latestDocParts) {
      const { key, documentId: docId, version, isNew } = item;

      // 如果已经打开过，跳过
      if (openedRef.current.has(key)) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.debug("[Artifact] skip duplicate open (tool)", { key });
        }
        continue;
      }

      // 只有新消息才自动打开，避免切换聊天时自动打开
      if (!isNew) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.debug("[Artifact] skip auto-open for existing message", {
            key,
          });
        }
        continue;
      }

      // Open the artifact panel directly using documentId and version
      loadAndShowArtifact(
        docId,
        {
          top: window.innerHeight / 2 - 180,
          left: window.innerWidth - 560,
          width: 520,
          height: 360,
        },
        version
      );

      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("[Artifact] open from tool", {
          documentId: docId,
          version,
        });
      }
      openedRef.current.add(key);
    }
  }, [latestDocParts, loadAndShowArtifact, messages.length]);
  return null;
}
