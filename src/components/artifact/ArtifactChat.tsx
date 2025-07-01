// components/artifact/ArtifactChat.tsx
"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@ai-sdk/react";
import { toast } from "sonner";
import { ChatInput } from "../chat/chat-input";
import { ArtifactMessage } from "./ArtifactMessage";
import { Thinking } from "../chat/thinking";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";

interface ArtifactChatProps {
	chatId: string;
	className?: string;
	// Chat state from parent component
	messages: Message[];
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

export function ArtifactChat({
	chatId,
	className,
	messages,
	input,
	handleInputChange,
	handleSubmit,
	status,
	stop,
	error,
	reload,
	isUploading,
	mcpEnabled,
	toggleMcpEnabled,
}: ArtifactChatProps) {
	const inputRef = useRef<HTMLTextAreaElement>(null);

	const { scrollAreaRef, endRef, isAtBottom, scrollToBottom } =
		useScrollToBottom({
			bottomThreshold: 100,
			scrollOnMount: true,
			forceScrollOnNewContent: false,
		});

	// Form submission handler
	const handleFormSubmit = async (
		e: React.FormEvent<HTMLFormElement>,
		options?: { experimental_attachments?: FileList },
	) => {
		e.preventDefault();

		if (!input.trim() && !options?.experimental_attachments) return;

		// Prevent multiple submissions
		if (status === "streaming" || status === "submitted" || isUploading) {
			return;
		}

		try {
			handleSubmit(e, options);
		} catch (error) {
			toast.error("Failed to send message", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	// Stop generation handler
	const handleStopGeneration = () => {
		stop();
		toast.info("Generation stopped");
		setTimeout(() => {
			inputRef.current?.focus();
		}, 100);
	};

	// Auto scroll to bottom
	useEffect(() => {
		if (messages.length > 0 && isAtBottom) {
			scrollToBottom();
		}
	}, [messages, isAtBottom, scrollToBottom]);

	return (
		<div className={`flex flex-col h-full bg-card ${className || ""}`}>
			{/* Message list area */}
			<div
				ref={scrollAreaRef}
				className="flex-1 overflow-y-auto overflow-x-hidden"
			>
				{messages.length === 0 ? (
					<div className="flex-1 flex items-center justify-center h-full">
						<div className="text-center px-4">
							<p className="text-sm text-muted-foreground">
								Start a new conversation
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								Chat with AI here
							</p>
						</div>
					</div>
				) : (
					<div className="space-y-0 min-w-0">
						{messages.map((message, index) => {
							const isLastMessage = index === messages.length - 1;
							return (
								<ArtifactMessage
									key={message.id}
									message={message}
									isLoading={status === "streaming" && isLastMessage}
								/>
							);
						})}
						<div ref={endRef} />
					</div>
				)}
			</div>

			{/* {status === "submitted" && (
				<div className="relative">
					<Thinking />
				</div>
			)} */}

			{/* Chat input area */}
			<div className="p-2">
				{/* Error display */}
				{error && (
					<div className="px-3 py-2 bg-destructive/10 border-t border-destructive/20">
						<p className="text-xs text-destructive">Error: {error.message}</p>
						<button
							type="button"
							onClick={() => reload()}
							className="text-xs text-destructive underline mt-1"
						>
							Retry
						</button>
					</div>
				)}
				<ChatInput
					input={input}
					handleInputChange={handleInputChange}
					handleSubmit={handleFormSubmit}
					handleStopGeneration={handleStopGeneration}
					mcpEnabled={mcpEnabled}
					toggleMcpEnabled={toggleMcpEnabled}
					status={status}
					isUploading={isUploading}
					className="max-w-none"
				/>
			</div>
		</div>
	);
}
