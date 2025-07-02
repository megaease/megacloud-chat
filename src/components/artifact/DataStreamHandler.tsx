// components/artifact/DataStreamHandler.tsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useArtifact } from "@/context/artifact-provider-context";
import type {
	DataStreamDelta,
	ArtifactKind,
	ArtifactLanguage,
} from "@/lib/artifact-types";

interface DataStreamHandlerProps {
	chatId: string;
}

// 类型守卫函数
function isValidDataStreamDelta(data: unknown): data is DataStreamDelta {
	if (typeof data !== "object" || data === null) return false;

	const candidate = data as Record<string, unknown>;
	return (
		typeof candidate.type === "string" && typeof candidate.content === "string"
	);
}

export function DataStreamHandler({ chatId }: DataStreamHandlerProps) {
	const { data: dataStream } = useChat({ id: chatId });
	const { setArtifact } = useArtifact();
	const queryClient = useQueryClient();
	const lastProcessedIndex = useRef(-1);
	const currentDocumentId = useRef<string>("");

	// 使用 useCallback 优化 delta 处理函数
	const processDelta = useCallback(
		(delta: DataStreamDelta) => {
			console.log(
				"DataStreamHandler processing delta:",
				delta.type,
				delta.content?.substring(0, 50),
			);

			switch (delta.type) {
				case "id":
					currentDocumentId.current = delta.content;
					break;

				case "title":
					setArtifact((prev) => ({ ...prev, title: delta.content }));
					break;

				case "kind":
					setArtifact((prev) => ({ ...prev, kind: delta.content as ArtifactKind }));
					break;

				case "language":
					setArtifact((prev) => ({ ...prev, language: delta.content as ArtifactLanguage }));
					break;

				case "status":
					// 处理状态变更：creating, updating, streaming
					console.log("� Processing status signal:", delta.content);
					if (delta.content === "creating" || delta.content === "updating") {
						// 设置为 creating/updating 状态并显示 artifact
						setArtifact((prev) => ({
							...prev,
							status: delta.content as "creating" | "updating",
							isVisible: true,
						}));
					}
					break;

				case "clear":
					// 清空内容，开始新的流式传输
					console.log("📝 Processing clear signal - starting streaming");
					setArtifact((prev) => ({
						...prev,
						content: "",
						status: "streaming" as const,
						isVisible: true,
					}));
					break;

				case "text-delta":
				case "code-delta":
				case "sheet-delta":
					// 追加流式内容
					setArtifact((prev) => ({
						...prev,
						content: prev.content + delta.content,
						status: "streaming",
					}));
					break;

				case "finish":
					// 完成流式传输
					setArtifact((prev) => ({
						...prev,
						documentId: currentDocumentId.current || prev.documentId,
						status: "idle",
					}));
					// 清理查询缓存，确保下次获取最新数据
					if (currentDocumentId.current) {
						queryClient.invalidateQueries({
							queryKey: ["artifact-versions", currentDocumentId.current],
						});
					}
					break;

				case "id-update": {
					// 更新文档 ID（用于从临时 ID 到真实 ID 的映射）
					const newDocumentId = delta.content;
					if (newDocumentId && newDocumentId !== currentDocumentId.current) {
						currentDocumentId.current = newDocumentId;
						setArtifact((prev) => ({
							...prev,
							documentId: newDocumentId,
							status: "idle",
						}));
					}
					break;
				}

				default:
					console.warn("Unknown delta type:", delta.type);
			}
		},
		[setArtifact, queryClient],
	);

	// 处理数据流
	useEffect(() => {
		if (!dataStream || dataStream.length === 0) return;

		// 只处理新的 delta 数据
		const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
		if (newDeltas.length === 0) return;

		// 更新已处理的索引
		lastProcessedIndex.current = dataStream.length - 1;

		// 处理所有新的 delta
		for (const item of newDeltas) {
			if (isValidDataStreamDelta(item)) {
				processDelta(item);
			}
		}
	}, [dataStream, processDelta]);

	// 清理函数
	useEffect(() => {
		return () => {
			// 组件卸载时重置状态
			lastProcessedIndex.current = -1;
			currentDocumentId.current = "";
		};
	}, []);

	// 这个组件不渲染任何 UI
	return null;
}
