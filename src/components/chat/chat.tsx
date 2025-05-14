"use client";

import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import {
	Loader2,
	Send,
	Square,
	AudioWaveform,
	PanelRight,
	X,
	ArrowDown,
} from "lucide-react";
import { ChatMessage } from "../chat-message";
import { Textarea } from "../ui/textarea";
import { nanoid } from "nanoid";
import { use, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useApiSettings } from "@/context/api-settings-context";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { cn } from "@/lib/utils";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { ChatItem } from "./chat-item";

function useChatMessages(chatId: string | undefined) {
	const query = useQuery({
		queryKey: ["chats", "user-id", chatId], // Replace with actual user ID
		queryFn: async () => {
			const res = await fetch(`/api/chats/${chatId}`, {
				headers: {
					userId: "user-id", // Replace with actual user ID
				},
			});
			const data = await res.json();
			return data.chat.messages;
		},
		staleTime: 1000 * 60 * 2,
		enabled: !!chatId,
	});
	return query;
}

export function Chat() {
	const { id } = useParams();
	const chatId = id as string | undefined;
	const router = useRouter();
	const queryClient = useQueryClient();
	const { apiKey, modelName, baseUrl } = useApiSettings();
	const [randomChatId, setRandomChatId] = useState<string | undefined>(
		undefined,
	);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	// Use useScrollToBottom hook to manage scrolling
	const {
		autoScroll,
		hasScrolledUp,
		scrollToBottom,
		scrollAreaRef, // Get scrollAreaRef from hook
		messagesEndRef, // Get messagesEndRef from hook
	} = useScrollToBottom({
		adaptRadixScrollArea: false,
		scrollOnContentChange: true,
		scrollOnMount: true,
		behavior: "smooth",
	});

	useEffect(() => {
		if (!chatId) {
			const newChatId = nanoid(16);
			setRandomChatId(newChatId);
		}
	}, [chatId]);

	const chatMessagesQuery = useChatMessages(chatId);
	const {
		data: chatMessages = [],
		isLoading: isLoadingMessage,
		isError: isLoadingError,
		error: loadingError,
	} = chatMessagesQuery;

	// Show error toast for loading errors
	useEffect(() => {
		if (isLoadingError && loadingError) {
			toast.error("Failed to load chat messages", {
				description:
					loadingError instanceof Error
						? loadingError.message
						: "Unknown error",
			});
		}
	}, [isLoadingError, loadingError]);

	const {
		messages,
		setMessages,
		input,
		handleInputChange,
		handleSubmit,
		status,
		stop,
		error,
		reload,
	} = useChat({
		id: chatId || randomChatId, // Unique ID for the chat session
		maxSteps: 10,
		body: {
			chatId: chatId || randomChatId,
			userId: "user-id", // Replace with actual user ID
			apiKey,
			modelName,
			baseUrl,
		},
		initialMessages: chatMessages,
		onFinish: (message) => {
			console.log("Message finished:", message);
			queryClient.invalidateQueries({
				queryKey: ["chats", "user-id"], // Replace with actual user ID
			});
			if (!chatId) {
				router.push(`/chat/${randomChatId}`);
			}
		},
		onError: (error) => {
			console.error("Error in chat:", error);
		},
	});

	useEffect(() => {
		if (autoScroll && (status === "streaming" || messages.length > 0)) {
			scrollToBottom();
		}
	}, [status, messages.length, autoScroll, scrollToBottom]);

	const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!input.trim()) return;
		if (error != null) {
			setMessages(messages.slice(0, -1)); // remove last message
		}
		await handleSubmit(e);

		setTimeout(() => {
			scrollToBottom();
			inputRef.current?.focus();
		}, 100);
	};

	const isLoading = status === "streaming" || status === "submitted";
	// Handle stop generation
	const handleStopGeneration = () => {
		stop();
		toast.info("Generation stopped", {
			description: "You can continue the conversation or start a new one.",
		});
		setTimeout(() => {
			inputRef.current?.focus();
		}, 100);
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
							ref={scrollAreaRef}
							className="h-full flex-1 relative overflow-y-auto px-2 sm:px-4 space-y-4"
						>
							{messages.map((message) => (
								<ChatMessage key={message.id} message={message} />
							))}

							{/* {isLoading &&
								messages &&
								messages.length > 0 &&
								messages?.[messages.length - 1]?.role !== "assistant" && (
									<ChatItem>
										<div className="flex items-center gap-2">
											<AudioWaveform className="h-4 w-4 text-primary animate-pulse" />
											<span className="text-muted-foreground">Thinking...</span>
											<Loader2 className="h-4 w-4 animate-spin text-primary" />
										</div>
									</ChatItem>
								)} */}

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
							<div ref={messagesEndRef} />

							{hasScrolledUp && (
								<div className="absolute bottom-28 right-8">
									<Button
										size="icon"
										variant="secondary"
										className="rounded-full shadow-md"
										onClick={scrollToBottom}
									>
										<ArrowDown className="h-4 w-4" />
									</Button>
								</div>
							)}
						</div>
					)}

					<div className="pt-4">
						{/* Chat input */}
						<div className="border-t p-4 text-center">
							<form onSubmit={handleFormSubmit} className="relative">
								<Textarea
									ref={inputRef}
									value={input}
									onChange={handleInputChange}
									placeholder="Type your message..."
									className="w-full resize-none rounded-2xl border-2 pr-12 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
									rows={3}
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											if (input.trim()) {
												const event = new Event("submit", {
													cancelable: true,
													bubbles: true,
												}) as unknown as React.FormEvent<HTMLFormElement>;
												handleFormSubmit(event);
											}
										}
									}}
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
