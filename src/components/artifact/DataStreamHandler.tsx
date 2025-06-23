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

		for (const deltaData of newDeltas as unknown as DataStreamDelta[]) {
			const delta = deltaData as DataStreamDelta;
			if (!delta || typeof delta !== "object" || !delta.type) continue;

			setArtifact((prev) => {
				switch (delta.type) {
					case "id":
						currentDocumentId.current = delta.content;
						return {
							...prev,
							documentId: delta.content,
							status: "streaming",
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
							status: "streaming", // Ensure we show streaming status
						};

					case "finish":
						// When streaming finishes, just mark as idle
						// Note: Don't fetch from database here as content is already updated via stream
						// If user opens artifact from tool result, ArtifactContent will handle data fetching
						return {
							...prev,
							status: "idle",
						};

					default:
						return prev;
				}
			});
		}
	}, [dataStream, setArtifact]);

	return null; // This component doesn't render any UI
}
