"use client";

import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { ChatMessage } from "../chat-message";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";
import { nanoid } from "nanoid";
import { use, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useApiSettings } from "@/context/api-settings-context";
import { toast } from "sonner";

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
	console.log(" id chatMessages", chatId, randomChatId);
	const { messages, input, handleInputChange, handleSubmit, status } = useChat({
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
			const { setIsOpen } = useApiSettings();

			// Detect API key issues
			if (
				error.message.includes("API key") ||
				error.message.includes("auth") ||
				error.message.includes("key") ||
				error.message.includes("Authentication")
			) {
				toast.error("API Authentication Error", {
					description: "Please check your API key in settings",
					action: {
						label: "Open Settings",
						onClick: () => setIsOpen(true),
					},
				});
			}
			// Detect model issues
			else if (
				error.message.includes("model") ||
				error.message.includes("not found") ||
				error.message.includes("unavailable") ||
				error.message.includes("does not exist")
			) {
				toast.error("Model Error", {
					description: "The specified model is not available or doesn't exist",
					action: {
						label: "Open Settings",
						onClick: () => setIsOpen(true),
					},
				});
			}
			// Detect API URL issues
			else if (
				error.message.includes("URL") ||
				error.message.includes("connect") ||
				error.message.includes("network") ||
				error.message.includes("ENOTFOUND")
			) {
				toast.error("Connection Error", {
					description:
						"Could not connect to the API. Check the base URL in settings",
					action: {
						label: "Open Settings",
						onClick: () => setIsOpen(true),
					},
				});
			}
			// General errors
			else {
				toast.error("Chat Error", {
					description:
						error.message.substring(0, 100) || "An unexpected error occurred",
				});
			}
		},
	});

	console.log("messages", messages, status);

	const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!input.trim()) return;

		await handleSubmit(e);
	};

	const isLoading = status === "streaming" || status === "submitted";

	return (
		<div className="mx-auto flex h-full w-full max-w-3xl flex-col px-4 sm:px-6 py-4">
			{messages.length === 0 ? (
				<div className="flex h-full items-center justify-center">
					<p className="text-primary">Start a conversation</p>
				</div>
			) : (
				<ScrollArea className="h-full flex-1 overflow-y-auto px-4 sm:px-6">
					<div className="mb-4 h-full space-y-4">
						{messages.map((message) => (
							<ChatMessage key={message.id} message={message} />
						))}
					</div>
				</ScrollArea>
			)}

			<div className="mx-auto flex w-full flex-col px-4 sm:px-6 md:py-4 ">
				{/* Chat input */}
				<div className="border-t p-4 text-center">
					<form onSubmit={handleFormSubmit} className="relative">
						<Textarea
							value={input}
							onChange={handleInputChange}
							placeholder="Type your message..."
							className="w-full resize-none rounded-2xl border-2 pr-12 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							disabled={isLoading}
						/>
						<Button
							type="submit"
							size="icon"
							disabled={isLoading || !input.trim()}
							className="absolute right-2 bottom-2 h-8 w-8"
						>
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Send className="h-4 w-4" />
							)}
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
