"use client";

import { useEffect, useRef } from "react";
import { useArtifact } from "@/context/artifact-provider-context";
import type { ArtifactKind, ArtifactLanguage } from "@/lib/artifact-types";
import type { UIMessage } from "ai";

interface DataStreamHandlerProps {
	chatId: string;
	messages?: UIMessage[];
}

/**
 * DataStreamHandler that processes AI SDK v5 messages and extracts data events
 * Handles artifact creation/update streaming data from messages
 */
export function DataStreamHandler({ chatId, messages = [] }: DataStreamHandlerProps) {
	const { setArtifact, showArtifact } = useArtifact();
	const lastProcessedIndex = useRef(-1);
	const lastChatIdRef = useRef(chatId);
	const currentArtifactRef = useRef<{
		id?: string;
		kind?: string;
		title?: string;
		language?: string;
		content?: string;
	}>({});

	// Reset state when switching chats
	useEffect(() => {
		if (lastChatIdRef.current !== chatId) {
			lastProcessedIndex.current = -1;
			lastChatIdRef.current = chatId;
			currentArtifactRef.current = {};
		}
	}, [chatId]);

	useEffect(() => {
		if (!messages?.length) return;

		// Extract data events from new messages
		const dataEvents: Array<{ type: string; data: unknown }> = [];
		
		for (let i = lastProcessedIndex.current + 1; i < messages.length; i++) {
			const message = messages[i];
			if (!message || message.role !== "assistant") continue;

			// Look for data events in message parts
			const parts = (message.parts || []) as Array<{
				type?: string;
				data?: unknown;
				[key: string]: unknown;
			}>;

			for (const part of parts) {
				if (part.type?.startsWith("data-")) {
					dataEvents.push({
						type: part.type,
						data: part.data,
					});
				}
			}
		}

		lastProcessedIndex.current = messages.length - 1;

		// Process the data events
		for (const delta of dataEvents) {
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
	}, [messages, setArtifact, showArtifact]);

	return null;
}
