"use client";

import { ChatInput } from "@/components/chat/chat-input";
import {
	ChatContainerContent,
	ChatContainerRoot,
	ChatContainerScrollAnchor,
} from "@/components/prompt-kit/chat-container";
import { ScrollButton } from "@/components/prompt-kit/scroll-button";
import type { UIMessage } from "ai";
import { ArtifactMessage } from "./ArtifactMessage";

interface ChatMessageProps {
	message: UIMessage | UIMessage;
	isLoading: boolean;
	isCompact?: boolean; // Compact mode for narrow screens like Artifact sidebar
	isLastMessage?: boolean;
	error?: Error | null;
	status?: "error" | "submitted" | "streaming" | "ready";
	retry?: () => void;
	regenerate?: () => void;
	onEdit?: (messageId: string) => void;
	onCancelEdit?: () => void;
	onSaveEdit?: (messageId: string, content: string) => Promise<void>;
	isEditing?: boolean;
}

// Create a proper ArtifactChat component that matches the expected interface
interface ArtifactChatProps {
	className?: string;
	chatId: string;
	messages: UIMessage[];
	input: string;
	handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	handleSubmit: (
		e: React.FormEvent<HTMLFormElement>,
		options?: { experimental_attachments?: FileList },
	) => void;
	status: "error" | "submitted" | "streaming" | "ready";
	stop: () => void;
	error: Error | undefined;
	reload: () => void;
	isUploading: boolean;
	mcpEnabled: boolean;
	toggleMcpEnabled: () => boolean;
}

export function ArtifactChat(props: ArtifactChatProps) {
	return (
		<div
			className={`flex flex-col h-full min-h-0 bg-white dark:bg-gray-900 ${
				props.className || ""
			}`}
		>
			<div className="flex-1 relative min-h-0">
				<ChatContainerRoot className="h-full px-2 sm:px-3">
					<ChatContainerContent className="w-full mx-auto flex flex-col gap-2 py-3">
						{props.messages.map((message, index) => (
							<ArtifactMessage
								key={message.id}
								message={message}
								isLoading={
									props.status === "streaming" &&
									index === props.messages.length - 1
								}
							/>
						))}
						<ChatContainerScrollAnchor />
					</ChatContainerContent>
					<div className="absolute bottom-3 right-3 z-10">
						<ScrollButton />
					</div>
				</ChatContainerRoot>
			</div>

			<div className="flex-shrink-0">
				<ChatInput
					input={props.input}
					handleInputChange={props.handleInputChange}
					handleSubmit={props.handleSubmit}
					handleStopGeneration={props.stop}
					mcpEnabled={props.mcpEnabled}
					toggleMcpEnabled={props.toggleMcpEnabled}
					status={props.status}
					isUploading={props.isUploading}
				/>
			</div>
		</div>
	);
}

// Export as both ChatMessage and ArtifactChat for compatibility
// Remove the duplicate export
