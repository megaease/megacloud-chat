// components/artifact/ArtifactMessage.tsx
"use client";

import { ChatMessage } from "@/components/chat/chat-message";
import type { UIMessage } from "ai";

interface ArtifactMessageProps {
	message: UIMessage;
	isLoading?: boolean;
}

/**
 * ArtifactMessage component directly reuses ChatMessage component
 * Ensures message display in Artifact sidebar is consistent with main chat area
 * Uses compact mode to adapt to 400px wide sidebar
 */
export function ArtifactMessage({
	message,
	isLoading = false,
}: ArtifactMessageProps) {
	return (
		<div className="min-w-0 overflow-hidden p-1 bg-card">
			{/* Use ChatMessage component to render message */}
			<ChatMessage message={message} isLoading={isLoading} isCompact={true} />
		</div>
	);
}
