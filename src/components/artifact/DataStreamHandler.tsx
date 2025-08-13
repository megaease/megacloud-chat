"use client";

import { useArtifact } from "@/context/artifact-provider-context";
import type { ArtifactKind, ArtifactLanguage } from "@/lib/artifact-types";
import { useEffect, useRef } from "react";

export interface DataStreamDelta {
	type: string;
	data: unknown;
}

interface DataStreamHandlerProps {
	dataStream?: DataStreamDelta[];
}

/**
 * Simplified DataStreamHandler that processes AI SDK v5 dataStream deltas
 * Handles artifact creation/update streaming data
 */
export function DataStreamHandler({ dataStream = [] }: DataStreamHandlerProps) {
	const { setArtifact, showArtifact } = useArtifact();
	const lastProcessedIndex = useRef(-1);
	const currentArtifactRef = useRef<{
		id?: string;
		kind?: string;
		title?: string;
		language?: string;
		content?: string;
	}>({});

	useEffect(() => {
		if (!dataStream?.length) return;

		const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
		lastProcessedIndex.current = dataStream.length - 1;

		for (const delta of newDeltas) {
			const current = currentArtifactRef.current;

			switch (delta.type) {
				case "data-id":
					current.id = delta.data as string;
					break;

				case "data-kind":
					current.kind = delta.data as string;
					break;

				case "data-title":
					current.title = delta.data as string;
					break;

				case "data-language":
					current.language = delta.data as string;
					break;

				case "data-clear":
					current.content = "";
					break;

				case "data-content":
					current.content = delta.data as string;
					break;

				case "data-finish":
					// When streaming finishes, update artifact state and open UI
					if (current.id && current.content) {
						setArtifact({
							documentId: current.id,
							kind: (current.kind as ArtifactKind) || "text",
							title: current.title || "Untitled",
							language: current.language as ArtifactLanguage,
							content: current.content,
							status: "idle",
							isVisible: false,
							boundingBox: {
								top: 0,
								left: 0,
								width: 520,
								height: 360,
							},
						});

						// Auto-open artifact panel
						showArtifact({
							top: window.innerHeight / 2 - 180,
							left: window.innerWidth - 560,
							width: 520,
							height: 360,
						});

						// Reset for next artifact
						currentArtifactRef.current = {};
					}
					break;

				default:
					// Ignore unknown delta types
					break;
			}
		}
	}, [dataStream, setArtifact, showArtifact]);

	return null;
}
