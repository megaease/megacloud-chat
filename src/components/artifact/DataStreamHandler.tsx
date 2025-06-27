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
	const wasUpdatingDocument = useRef<boolean>(false);

	// 使用 useCallback 优化 delta 处理函数
	const processDelta = useCallback(
		(delta: DataStreamDelta) => {
			console.log(
				"DataStreamHandler processing delta:",
				delta.type,
				delta.content?.substring(0, 50),
			);

			setArtifact((prev) => {
				switch (delta.type) {
					case "id":
						currentDocumentId.current = delta.content;
						// Check if this is an update to an existing document
						// If the previous artifact already had the same documentId, it's an update
						wasUpdatingDocument.current =
							prev.documentId === delta.content && !!prev.documentId;

						console.log("DataStreamHandler: Document ID received", {
							documentId: delta.content,
							previousDocumentId: prev.documentId,
							isUpdate: wasUpdatingDocument.current,
						});

						return {
							...prev,
							documentId: delta.content,
							status: "streaming",
							dataSource: "stream",
							isStreaming: true,
							// Keep isVisible if user has already opened the artifact
							isVisible: prev.isVisible || false,
						};

					case "title":
						return {
							...prev,
							title: delta.content,
							isVisible: prev.isVisible,
							status: "streaming",
							dataSource: "stream",
							isStreaming: true,
						};

					case "kind":
						return {
							...prev,
							kind: delta.content as ArtifactKind,
							isVisible: prev.isVisible,
							status: "streaming",
							dataSource: "stream",
							isStreaming: true,
						};

					case "language":
						return {
							...prev,
							language: delta.content as ArtifactLanguage,
							isVisible: prev.isVisible,
							status: "streaming",
							dataSource: "stream",
							isStreaming: true,
						};

					case "clear":
						return {
							...prev,
							content: "",
							isVisible: prev.isVisible,
							status: "streaming",
							dataSource: "stream",
							isStreaming: true,
						};

					case "text-delta":
					case "code-delta":
					case "sheet-delta":
						return {
							...prev,
							content: prev.content + delta.content,
							isVisible: true,
							status: "streaming",
							dataSource: "stream",
							isStreaming: true,
						};

					case "id-update":
						// 更新真实的文档 ID
						currentDocumentId.current = delta.content;
						return {
							...prev,
							documentId: delta.content,
						};

					case "finish": {
						// 流式传输完成
						const finalDocumentId = currentDocumentId.current;

						// If this was an update to an existing document, refresh the versions
						if (wasUpdatingDocument.current && finalDocumentId) {
							console.log(
								"Document update completed, refreshing versions for:",
								finalDocumentId,
							);

							// Invalidate the versions query to trigger a refetch
							setTimeout(() => {
								console.log("Invalidating queries for:", finalDocumentId);
								queryClient.invalidateQueries({
									queryKey: ["artifact-versions", finalDocumentId],
								});
							}, 500); // Small delay to ensure database has been updated
						} else {
							console.log("Not refreshing versions:", {
								wasUpdating: wasUpdatingDocument.current,
								documentId: finalDocumentId,
							});
						}

						// Reset the flag
						wasUpdatingDocument.current = false;

						return {
							...prev,
							status: "idle",
							isStreaming: false,
							streamingProgress: 100,
							isVisible: prev.isVisible,
							documentId: finalDocumentId, // 确保使用最新的 documentId
							dataSource: "stream",
							content: prev.content.trim(), // 确保内容没有多余的空格
						};
					}

					default:
						console.warn("Unknown delta type:", delta.type);
						return prev;
				}
			});
		},
		[setArtifact, queryClient],
	);

	// 处理错误的函数
	const handleError = useCallback(
		(error: unknown, deltaData: unknown) => {
			console.error("Error processing delta:", error, deltaData);
			setArtifact((prev) => ({
				...prev,
				status: "error",
				isStreaming: false,
			}));
		},
		[setArtifact],
	);

	useEffect(() => {
		if (!dataStream?.length) return;

		const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
		lastProcessedIndex.current = dataStream.length - 1;

		for (const deltaData of newDeltas) {
			try {
				// 使用类型守卫进行安全的类型检查
				if (!isValidDataStreamDelta(deltaData)) {
					console.warn("Invalid delta data:", deltaData);
					continue;
				}

				processDelta(deltaData);
			} catch (error) {
				handleError(error, deltaData);
			}
		}
	}, [dataStream, processDelta, handleError]);

	// 组件卸载时的清理
	useEffect(() => {
		return () => {
			lastProcessedIndex.current = -1;
			currentDocumentId.current = "";
		};
	}, []);

	return null; // This component doesn't render any UI
}
