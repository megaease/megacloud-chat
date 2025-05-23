"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
	Loader2,
	Send,
	Square,
	AudioWaveform,
	ArrowDown,
	Paperclip,
	Power,
	PowerOff,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./chat-message";
import { ChatItem } from "./chat-item";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom-mutation";
import type { Message } from "@ai-sdk/react";
import { ModelSelector } from "./model-selector";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Thinking } from "./thinking";

// Define the Model interface
interface Model {
	id: string;
	name: string;
}

interface ChatViewProps {
	messages: Message[];
	input: string;
	handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	handleStopGeneration: () => void;
	isLoading: boolean;
	error: Error | null;
	reload: () => void;
	mcpEnabled: boolean;
	toggleMcpEnabled: () => boolean;
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
	mcpEnabled,
	toggleMcpEnabled,
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

				// Scroll to bottom after submitting
				setTimeout(() => {
					scrollToBottom();
				}, 100);
			}
		}
	};

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
						{messages.map((message) => (
							<ChatMessage key={message.id} message={message} />
						))}

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
					<ArrowDown className="h-4 w-4" />
				</Button>
			)}

			{isLoading && <Thinking />}
			{/* Chat input */}
			<div className="p-4 relative max-w-4xl text-center w-full mx-auto">
				<form onSubmit={handleSubmit} className="relative">
					<div className="relative rounded-2xl border border-border/50 bg-background/95 shadow-md transition-all duration-300 ease-in-out focus-within:shadow-lg focus-within:border-primary/60 hover:shadow-lg group">
						<Textarea
							ref={inputRef}
							value={input}
							onChange={handleInputChange}
							onKeyDown={handleKeyDown}
							placeholder="Type your message..."
							className="min-h-24 w-full resize-none border-0 bg-transparent px-4 py-3 pr-14 focus-visible:ring-0 
							focus-visible:ring-offset-0 placeholder:text-muted-foreground/70 selection:bg-primary/20 pb-12"
							rows={2}
							autoFocus
						/>
						{/* MCP Toggle switch */}
						<div className="absolute bottom-2 left-2 flex items-center gap-2">
							<TooltipProvider>
								<Tooltip delayDuration={300}>
									<TooltipTrigger asChild>
										<div className="flex items-center rounded px-4 py-2 border border-border/50 transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 group">
											<span className="text-xs font-medium mr-2 text-muted-foreground group-hover:text-foreground/80">
												MCP
											</span>
											<Switch
												checked={mcpEnabled}
												onCheckedChange={() => toggleMcpEnabled()}
											/>
										</div>
									</TooltipTrigger>
									<TooltipContent side="top" className="text-xs font-medium">
										<p>{mcpEnabled ? "MCP Enabled" : "MCP Disabled"}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
						<div className="absolute bottom-2 right-2 flex items-center gap-2">
							{/* Upload button */}
							<TooltipProvider>
								<Tooltip delayDuration={300}>
									<TooltipTrigger asChild>
										<Button
											type="button"
											size="icon"
											variant="ghost"
											className="h-9 w-9 rounded-full text-muted-foreground/80 hover:text-primary hover:bg-primary/10 hover:scale-105 active:scale-95 transition-all duration-200"
										>
											<Paperclip className="h-4 w-4 transition-transform group-hover:rotate-12" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="top" className="text-xs font-medium">
										{" "}
										<p>Upload file</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							{isLoading ? (
								<TooltipProvider>
									<Tooltip delayDuration={300}>
										<TooltipTrigger asChild>
											<Button
												size="icon"
												onClick={handleStopGeneration}
												variant="ghost"
												className="h-9 w-9 rounded-full bg-primary text-primary-foreground 
												hover:text-primary-foreground
												shadow-md transition-all duration-200 hover:scale-110 hover:shadow-lg hover:bg-primary/90 disabled:opacity-60 disabled:hover:scale-100 disabled:hover:bg-primary disabled:hover:shadow-md active:scale-95"
												type="button"
											>
												<Square className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent side="top" className="text-xs font-medium">
											<p>Stop generation</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							) : (
								<TooltipProvider>
									<Tooltip delayDuration={300}>
										<TooltipTrigger asChild>
											<Button
												type="submit"
												size="icon"
												disabled={isLoading || !input.trim()}
												className="h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-md transition-all duration-200 hover:scale-110 hover:shadow-lg hover:bg-primary/90 disabled:opacity-60 disabled:hover:scale-100 disabled:hover:bg-primary disabled:hover:shadow-md active:scale-95"
											>
												<Send className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent side="top" className="text-xs font-medium">
											<p>Send message</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
