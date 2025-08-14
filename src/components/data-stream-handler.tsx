"use client";

import { useEffect, useRef } from "react";
import { useArtifact } from "@/context/artifact-provider-context";
import { useDataStream } from "./data-stream-provider";
import { useQueryClient } from "@tanstack/react-query";
import type { StreamDelta } from "@/types/stream-delta";
import type { ArtifactLanguage } from "@/lib/artifact-types";

export function DataStreamHandler() {
  const { dataStream } = useDataStream();
  console.log("dataStream", dataStream);
  const { artifact, setArtifact } = useArtifact();
  const queryClient = useQueryClient();
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    for (const delta of newDeltas) {
      // 直接处理数据流，不使用 artifactDefinitions
      setArtifact((draftArtifact) => {
        switch (delta.type) {
          case "data-id":
            return {
              ...draftArtifact,
              documentId: delta.data as string,
              status: "streaming" as const,
            };

          case "data-title":
            return {
              ...draftArtifact,
              title: delta.data as string,
              status: "streaming" as const,
            };

          case "data-kind":
            return {
              ...draftArtifact,
              kind: delta.data as "text" | "code" | "sheet" | "image",
              status: "streaming" as const,
            };

          case "data-language":
            return {
              ...draftArtifact,
              language: delta.data as ArtifactLanguage,
              status: "streaming" as const,
            };

          case "data-clear":
            return {
              ...draftArtifact,
              content: "",
              status: "streaming" as const,
            };

          case "data-finish":
            // 当新版本生成完成后，刷新版本列表缓存
            if (draftArtifact.documentId) {
              queryClient.invalidateQueries({
                queryKey: ["artifact-versions", draftArtifact.documentId],
              });
            }
            return {
              ...draftArtifact,
              status: "idle" as const,
            };

          default:
            // 处理内容增量
            if (
              delta.type === "data-textDelta" ||
              delta.type === "data-codeDelta" ||
              delta.type === "data-sheetDelta" ||
              delta.type === "data-imageDelta"
            ) {
              const newContent = draftArtifact.content + (delta.data as string);
              const isFirstContent = draftArtifact.content.length === 0;

              // 智能判断显示时机 - 在 AI 开始生成内容时就显示
              let shouldShow = false;

              if (draftArtifact.kind === "text") {
                // 文本类型：在 stream 过程中尽早显示
                shouldShow = newContent.length > 0;
              } else if (draftArtifact.kind === "code") {
                // 代码类型：有内容就显示
                shouldShow = newContent.length > 0;
              } else if (draftArtifact.kind === "sheet") {
                // 表格类型：有内容就显示
                shouldShow = newContent.length > 0;
              } else if (draftArtifact.kind === "image") {
                // 图片类型：有内容就显示
                shouldShow = newContent.length > 0;
              }

              return {
                ...draftArtifact,
                content: newContent,
                isVisible: shouldShow,
              };
            }

            return draftArtifact;
        }
      });
    }
  }, [dataStream, setArtifact, queryClient]);

  return null;
}
