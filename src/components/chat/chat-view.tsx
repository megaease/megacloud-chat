"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Loader2,
	Send,
	Square,
	AudioWaveform,
	ArrowDown,
	Upload,
	Paperclip,
	ChevronDown,
	Settings,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ChatMessage } from "../chat-message";
import { ChatItem } from "./chat-item";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom-mutation";
import type { Message } from "@ai-sdk/react";
import { Markdown } from "../markdown";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

// Define the Model interface
interface Model {
	id: string;
	name: string;
	color: string;
}

// Placeholder for API URL and Key - replace with your actual values
const MODELS_API_URL = "/api/models"; // TODO: Replace with your actual API endpoint
const API_KEY = "YOUR_API_KEY"; // TODO: Replace with your actual API key or use context/env

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
	const [activeModel, setActiveModel] = useState<Model | null>(null);
	const [availableModels, setAvailableModels] = useState<Model[]>([]);

	// Fetch models from API
	useEffect(() => {
		const fetchModels = async () => {
			try {
				const response = await fetch(MODELS_API_URL, {
					headers: {
						Authorization: `Bearer ${API_KEY}`,
					},
				});

				if (!response.ok) {
					throw new Error(`Failed to fetch models: ${response.statusText}`);
				}

				const fetchedModels: Model[] = await response.json();

				if (fetchedModels && fetchedModels.length > 0) {
					setAvailableModels(fetchedModels);
					setActiveModel(fetchedModels[0]);
				} else {
					setAvailableModels([]);
					setActiveModel(null);
					console.warn("No models fetched or model list is empty.");
				}
			} catch (err) {
				console.error("Error fetching models:", err);
				setAvailableModels([]);
				setActiveModel(null);
			}
		};

		fetchModels();
	}, []);

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

			{/* Chat input */}
			<div className="p-4 relative max-w-4xl text-center w-full mx-auto">
				<form onSubmit={handleSubmit} className="relative">
					<div className="relative rounded-2xl border border-border/50 bg-background/95 shadow-md transition-all duration-300 ease-in-out focus-within:shadow-lg focus-within:border-primary/60 hover:shadow-lg group">
						{/* Model selector */}
						<div className="absolute top-2 left-3 flex items-center z-10">
							<DropdownMenu>
								<TooltipProvider>
									<Tooltip delayDuration={300}>
										<TooltipTrigger asChild>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="sm"
													className="h-7 gap-1 px-2 text-xs font-normal text-muted-foreground hover:bg-primary/10 hover:text-foreground transition-colors"
													disabled={
														!activeModel && availableModels.length === 0
													}
												>
													{activeModel ? (
														<span className="flex items-center gap-1.5">
															<span
																className={cn(
																	"h-2.5 w-2.5 rounded-full",
																	`bg-${activeModel.color}`,
																)}
															/>
															{activeModel.name}
														</span>
													) : (
														<span className="flex items-center gap-1.5">
															<Loader2 className="h-3 w-3 animate-spin" />
															Loading...
														</span>
													)}
													<ChevronDown className="h-3 w-3 opacity-50" />
												</Button>
											</DropdownMenuTrigger>
										</TooltipTrigger>
										<TooltipContent side="top" className="text-xs font-medium">
											<p>Select model</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
								<DropdownMenuContent align="start" className="w-48">
									{availableModels.length > 0 ? (
										availableModels.map((model) => (
											<DropdownMenuItem
												key={model.id}
												onClick={() => setActiveModel(model)}
												className="flex items-center gap-2 focus:bg-primary/10"
											>
												<span
													className={cn(
														"h-2.5 w-2.5 rounded-full",
														`bg-${model.color}`,
													)}
												/>
												{model.name}
											</DropdownMenuItem>
										))
									) : (
										<DropdownMenuItem
											disabled
											className="text-muted-foreground"
										>
											No models available
										</DropdownMenuItem>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						<Textarea
							ref={inputRef}
							value={input}
							onChange={handleInputChange}
							onKeyDown={handleKeyDown}
							placeholder="Type your message..."
							className="min-h-24 w-full resize-none border-0 bg-transparent px-4 py-3 pt-10 pr-14 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70 selection:bg-primary/20"
							rows={2}
							style={{
								height: input.split("\n").length > 3 ? "120px" : "auto",
								minHeight: "96px",
								transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
								transform: isLoading
									? "translateY(-2px) scale(0.99)"
									: "translateY(0) scale(1)",
							}}
							autoFocus
						/>

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
