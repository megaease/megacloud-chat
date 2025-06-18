"use client";

import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { IconArrowDown } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./chat-message";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom-mutation";
import type { Message } from "@ai-sdk/react";
import { ChatInput } from "./chat-input";
import { Thinking } from "./thinking";
import { Artifact } from "../artifact/Artifact";

// Define the Model interface
interface Model {
	id: string;
	name: string;
}

interface ChatViewProps {
	messages: Message[];
	input: string;
	handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	handleSubmit: (
		e: React.FormEvent<HTMLFormElement>,
		options?: { experimental_attachments?: FileList },
	) => void;
	handleStopGeneration: () => void;
	error: Error | null;
	reload: () => void;
	mcpEnabled: boolean;
	toggleMcpEnabled: () => boolean;
	status: "error" | "submitted" | "streaming" | "ready";
	isUploading?: boolean;
}

export function ChatView({
	messages,
	input,
	handleInputChange,
	handleSubmit,
	handleStopGeneration,
	mcpEnabled,
	toggleMcpEnabled,
	status,
	isUploading = false,
}: ChatViewProps) {
	const tCommon = useTranslations('Common');
	const { scrollAreaRef, endRef, isAtBottom, scrollToBottom } =
		useScrollToBottom({
			bottomThreshold: 100,
			scrollOnMount: true,
			forceScrollOnNewContent: false,
		});

	return (
		<div
			className={cn(
				"flex flex-col flex-1 h-full transition-all relative justify-center",
			)}
		>
			{messages.length === 0 ? (
				<div className="flex h-full items-center justify-center">
					<p className="text-primary">Start a conversation</p>
				</div>
			) : (
				<div
					className="h-full flex-1 relative overflow-y-auto px-2 sm:px-4 space-y-4"
					ref={scrollAreaRef}
					id="scrollable-chat"
				>
					<div className="w-full max-w-4xl mx-auto flex flex-col gap-2">
						{messages.map((message, index) => {
							const isLastMessage = index === messages.length - 1;
							return (
								<ChatMessage
									key={message.id}
									message={message}
									isLoading={status === "streaming" && isLastMessage}
								/>
							);
						})}

						<div ref={endRef} />
					</div>
				</div>
			)}

			{!isAtBottom && (
				<Button
					onClick={scrollToBottom}
					className="fixed bottom-24 right-6 rounded-full shadow-md z-10"
					size="icon"
					variant="secondary"
				>
					<IconArrowDown className="h-4 w-4" />
				</Button>
			)}

			{status === "submitted" && (
				<div className="relative">
					<Thinking />
				</div>
			)}

			{/* Chat input */}
			<ChatInput
				input={input}
				handleInputChange={handleInputChange}
				handleSubmit={handleSubmit}
				handleStopGeneration={handleStopGeneration}
				mcpEnabled={mcpEnabled}
				toggleMcpEnabled={toggleMcpEnabled}
				status={status}
				isUploading={isUploading}
			/>
		</div>
	);
}
