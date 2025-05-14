"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Square, AudioWaveform, ArrowDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ChatMessage } from "../chat-message";
import { ChatItem } from "./chat-item";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom-mutation";
import type { Message } from "@ai-sdk/react";

interface ChatViewProps {
	messages: Message[];
	input: string;
	handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	handleStopGeneration: () => void;
	isLoading: boolean;
	error: Error | null;
	reload: () => void;
}

export function ChatView({
	messages,
	input,
	handleInputChange,
	handleSubmit,
	handleStopGeneration,
	isLoading,
	error,
	reload,
}: ChatViewProps) {
	const inputRef = useRef<HTMLTextAreaElement>(null);

	const { scrollAreaRef, endRef, isAtBottom, scrollToBottom } =
		useScrollToBottom({
			bottomThreshold: 100,
			scrollOnMount: true,
			forceScrollOnNewContent: false,
		});

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (input.trim()) {
				const event = new Event("submit", {
					cancelable: true,
					bubbles: true,
				}) as unknown as React.FormEvent<HTMLFormElement>;
				handleSubmit(event);

				// 提交后主动滚动到底部
				setTimeout(() => {
					scrollToBottom();
				}, 100);
			}
		}
	};

	return (
		<div className="mx-auto flex h-full w-full max-w-4xl flex-col px-4 sm:px-6 py-4">
			<div className="flex flex-1 gap-4 h-full">
				<div
					className={cn("flex flex-col flex-1 h-full transition-all relative")}
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
							{messages.map((message) => (
								<ChatMessage key={message.id} message={message} />
							))}

							{error && (
								<ChatItem>
									<div className="flex items-center gap-2">
										<div>An error occurred.</div>
										<Button
											type="button"
											onClick={() => reload()}
											size={"sm"}
											variant="outline"
										>
											Retry
										</Button>
									</div>
								</ChatItem>
							)}

							{isLoading && (
								<div className="flex items-center gap-2 pl-2">
									<AudioWaveform className="h-4 w-4 text-primary animate-pulse" />
									<span className="text-muted-foreground">Thinking...</span>
									<Loader2 className="h-4 w-4 animate-spin text-primary" />
								</div>
							)}

							<div ref={endRef} />
						</div>
					)}

					{!isAtBottom && (
						<Button
							onClick={scrollToBottom}
							className="fixed bottom-24 right-6 rounded-full shadow-md z-10"
							size="icon"
							variant="secondary"
						>
							<ArrowDown className="h-4 w-4" />
						</Button>
					)}

					<div className="pt-4">
						{/* Chat input */}
						<div className="border-t p-4 text-center">
							<form onSubmit={handleSubmit} className="relative">
								<Textarea
									ref={inputRef}
									value={input}
									onChange={handleInputChange}
									onKeyDown={handleKeyDown}
									placeholder="Type your message..."
									className="w-full resize-none rounded-2xl border-2 pr-12 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
									rows={3}
								/>
								<div className="absolute right-2 bottom-2">
									{isLoading ? (
										<Button
											size="icon"
											onClick={handleStopGeneration}
											className="h-8 w-8"
											type="button"
										>
											<Square className="h-4 w-4" />
										</Button>
									) : (
										<Button
											type="submit"
											size="icon"
											disabled={isLoading || !input.trim()}
											className="h-8 w-8"
										>
											<Send className="h-4 w-4" />
										</Button>
									)}
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
