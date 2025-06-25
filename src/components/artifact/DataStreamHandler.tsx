// components/artifact/DataStreamHandler.tsx
"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { useArtifact } from "@/context/artifact-provider-context";
import type { DataStreamDelta, ArtifactKind } from "@/lib/artifact-types";

interface DataStreamHandlerProps {
	chatId: string;
}

export function DataStreamHandler({ chatId }: DataStreamHandlerProps) {
	const { data: dataStream } = useChat({ id: chatId });
	const { artifact, setArtifact } = useArtifact();
	const lastProcessedIndex = useRef(-1);
	const currentDocumentId = useRef<string>("");

	useEffect(() => {
		if (!dataStream?.length) return;

		const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
		lastProcessedIndex.current = dataStream.length - 1;

		for (const deltaData of newDeltas) {
			try {
				const delta = deltaData as unknown as DataStreamDelta;
				if (!delta || typeof delta !== "object" || !delta.type) {
					console.warn("Invalid delta data:", deltaData);
					continue;
				}

				setArtifact((prev) => {
					switch (delta.type) {
						case "id":
							currentDocumentId.current = delta.content;
							return {
								...prev,
								documentId: delta.content,
								status: "streaming",
								dataSource: "stream",
								isStreaming: true,
							};

						case "title":
							return {
								...prev,
								title: delta.content,
							};

						case "kind":
							return {
								...prev,
								kind: delta.content as ArtifactKind,
							};

						case "clear":
							return {
								...prev,
								content: "",
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

						case "finish":
							// 流式传输完成
							return {
								...prev,
								status: "idle",
								isStreaming: false,
								streamingProgress: 100,
							};

						default:
							console.warn("Unknown delta type:", delta.type);
							return prev;
					}
				});
			} catch (error) {
				console.error("Error processing delta:", error, deltaData);
				setArtifact((prev) => ({
					...prev,
					status: "error",
					isStreaming: false,
				}));
			}
		}

		// 清理函数
		return () => {
			// 组件卸载时重置引用
			lastProcessedIndex.current = -1;
			currentDocumentId.current = "";
		};
	}, [dataStream, setArtifact]);

	return null; // This component doesn't render any UI
}
