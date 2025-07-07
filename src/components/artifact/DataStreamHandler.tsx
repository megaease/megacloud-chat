// components/artifact/DataStreamHandler.tsx
"use client";

import { useEffect, useRef } from "react";
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
		typeof candidate.type === "string" && 
		(typeof candidate.content === "string" || candidate.content === undefined)
	);
}

export function DataStreamHandler({ chatId }: DataStreamHandlerProps) {
	const { data: dataStream } = useChat({ id: chatId });
	const { setArtifact } = useArtifact();
	const queryClient = useQueryClient();
	const lastProcessedIndex = useRef(-1);
	const currentDocumentId = useRef<string>("");

	// 处理数据流
	useEffect(() => {
		if (!dataStream?.length) return;

		// 只处理新的 delta 数据
		const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
		if (newDeltas.length === 0) return;

		// 更新已处理的索引
		lastProcessedIndex.current = dataStream.length - 1;

		// 处理所有新的 delta
		newDeltas.forEach((item) => {
			if (!isValidDataStreamDelta(item)) return;

			const delta = item;

			// 先处理需要保存到 ref 的数据
			if (delta.type === "id" && delta.content) {
				currentDocumentId.current = delta.content;
			}

			// 然后统一更新 artifact 状态
			setArtifact((prev) => {
				const result = (() => {
					switch (delta.type) {
						case "id":
							return {
								...prev,
								documentId: delta.content,
								status: "streaming" as const
							};

						case "title":
							return {
								...prev,
								title: delta.content,
								status: "streaming" as const,
				
							};

						case "kind":
							return {
								...prev,
								kind: delta.content as ArtifactKind,
								status: "streaming" as const,
								isVisible: true,
							};

						case "language":
							return {
								...prev,
								language: delta.content as ArtifactLanguage,
								status: "streaming" as const
							};

				
						case "clear":
							return {
								...prev,
								content: "",
								status: "streaming" as const,
							};

						case "text-delta":
						case "code-delta":
						case "sheet-delta":
						case "image-delta":
							const newContent = prev.content + delta.content;
							return {
								...prev,
								content: newContent,
								status: "streaming" as const,
							};

						case "finish":
							// 完成流式传输后清理查询缓存
							if (currentDocumentId.current) {
								queryClient.invalidateQueries({
									queryKey: ["artifact-versions", currentDocumentId.current],
								});
							}
							const finalState = {
								...prev,
								documentId: currentDocumentId.current || prev.documentId,
								status: "idle" as const,
							};
							return finalState;

						case "id-update":
							const newDocumentId = delta.content;
							if (newDocumentId && newDocumentId !== currentDocumentId.current) {
								currentDocumentId.current = newDocumentId;
								return {
									...prev,
									documentId: newDocumentId,
									status: "idle" as const,
								};
							}
							return prev;

						default:
							return prev;
					}
				})();
				
				return result;
			});
		});
	}, [dataStream, setArtifact, queryClient]);

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
