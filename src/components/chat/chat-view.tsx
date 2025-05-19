"use client";

import React, { useEffect, useRef, useState } from "react";
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
import { useApiSettings } from "@/context/api-settings-context";
import { useQuery } from "@tanstack/react-query";

// Define the Model interface
interface Model {
	id: string;
	name: string;
	color: string;
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
	const { apiKey, baseUrl, modelName, isConfigured } = useApiSettings();

	// Fetch models using React Query
	const {
		data: modelsData,
		isLoading: isLoadingModels,
		error: modelsError,
	} = useQuery({
		queryKey: ["models", apiKey, baseUrl],
		queryFn: async () => {
			if (!apiKey || !baseUrl || !isConfigured) {
				return { models: [] };
			}

			const response = await fetch("/api/models/list", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					apiKey,
					baseUrl,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.error || `Error ${response.status}: ${response.statusText}`,
				);
			}

			return response.json();
		},
		enabled: !!apiKey && !!baseUrl && isConfigured,
		retry: 1,
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
		refetchOnWindowFocus: false,
	});

	const availableModels = React.useMemo<Model[]>(() => {
		return (modelsData?.models || []).map((id: string) => ({
			id,
			name: id,
			color: id.includes("gpt-4")
				? "green-600"
				: id.includes("gpt-3.5")
					? "blue-500"
					: id.includes("claude")
						? "purple-500"
						: id.includes("deepseek")
							? "orange-500"
							: id.includes("llama")
								? "red-500"
								: "gray-500",
		}));
	}, [modelsData?.models]);

	// Set the active model when models are loaded
	useEffect(() => {
		if (availableModels.length > 0) {
			// First try to find a model that matches the configured modelName
			const foundModel = availableModels.find(
				(model) => model.id === modelName,
			);
			if (foundModel) {
				setActiveModel(foundModel);
			} else if (!activeModel && availableModels[0]) {
				// If no match or no active model, select the first one
				setActiveModel(availableModels[0]);
			}
		}
	}, [availableModels, modelName, activeModel]);

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
														isLoadingModels ||
														(!isConfigured && availableModels.length === 0)
													}
												>
													{activeModel ? (
														<span className="flex items-center gap-1.5">
															<span
																className={cn(
																	"h-2.5 w-2.5 rounded-full bg-current",
																	activeModel.color,
																)}
															/>
															{activeModel.name}
															<ChevronDown className="h-3 w-3 opacity-50" />
														</span>
													) : isLoadingModels ? (
														<span className="flex items-center gap-1.5">
															<Loader2 className="h-3 w-3 animate-spin" />
															Loading
															<ChevronDown className="h-3 w-3 opacity-50" />
														</span>
													) : !isConfigured ? (
														<span className="flex items-center gap-1.5">
															<Settings className="h-3 w-3" />
															Configure API
															<ChevronDown className="h-3 w-3 opacity-50" />
														</span>
													) : (
														<span className="flex items-center gap-1.5">
															<Settings className="h-3 w-3" />
															Select Model
															<ChevronDown className="h-3 w-3 opacity-50" />
														</span>
													)}
												</Button>
											</DropdownMenuTrigger>
										</TooltipTrigger>
										<TooltipContent side="top" className="text-xs font-medium">
											<p>Select Model</p>
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
														"h-2.5 w-2.5 rounded-full bg-current",
														model.color,
													)}
												/>
												{model.name}
											</DropdownMenuItem>
										))
									) : isLoadingModels ? (
										<DropdownMenuItem
											disabled
											className="text-muted-foreground"
										>
											<Loader2 className="h-3 w-3 mr-2 animate-spin" />
											Loading...
										</DropdownMenuItem>
									) : !isConfigured ? (
										<DropdownMenuItem
											disabled
											className="text-muted-foreground"
										>
											Please configure API settings first
										</DropdownMenuItem>
									) : (
										<DropdownMenuItem
											disabled
											className="text-muted-foreground"
										>
											No available models
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
