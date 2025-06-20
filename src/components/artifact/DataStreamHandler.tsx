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
						// When streaming finishes, fetch the final content from database
						if (currentDocumentId.current) {
							fetchFinalArtifactContent(currentDocumentId.current);
						}
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

	// Fetch final artifact content from database
	const fetchFinalArtifactContent = async (documentId: string) => {
		try {
			const response = await fetch(
				`/api/artifacts/${documentId}?userId=user-id`,
			);
			if (response.ok) {
				const { artifact: dbArtifact } = await response.json();
				setArtifact((prev) => ({
					...prev,
					content: dbArtifact.content,
					title: dbArtifact.title,
					kind: dbArtifact.kind,
					status: "idle",
				}));
			}
		} catch (error) {
			console.error("Error fetching final artifact content:", error);
			setArtifact((prev) => ({
				...prev,
				status: "error",
			}));
		}
	};

	return null; // This component doesn't render any UI
}
