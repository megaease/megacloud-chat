"use client";

import { useParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiSettings } from "@/context/api-settings-context";
import { ChatView } from "./chat-view";

// Fetch chat messages hook
function useChatMessages(chatId: string | undefined) {
	const query = useQuery({
		queryKey: ["chats", "user-id", chatId],
		queryFn: async () => {
			const res = await fetch(`/api/chats/${chatId}`, {
				headers: {
					userId: "user-id",
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

// Container component that handles data and state
export function ChatContainer() {
	const { id } = useParams();
	const chatId = id as string | undefined;
	const router = useRouter();
	const queryClient = useQueryClient();
	const { apiKey, modelName, baseUrl } = useApiSettings();
	const [randomChatId, setRandomChatId] = useState<string | undefined>(
		undefined,
	);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	// Generate random ID if no chatId exists
	useEffect(() => {
		if (!chatId) {
			const newChatId = nanoid(16);
			setRandomChatId(newChatId);
		}
	}, [chatId]);

	// Get chat messages
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

	// Use AI chat hooks
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
		id: chatId || randomChatId,
		maxSteps: 10,
		body: {
			chatId: chatId || randomChatId,
			userId: "user-id",
			apiKey,
			modelName,
			baseUrl,
		},
		initialMessages: chatMessages,
		onFinish: (message) => {
			console.log("Message finished:", message);
			queryClient.invalidateQueries({
				queryKey: ["chats", "user-id"],
			});
			if (!chatId) {
				router.push(`/chat/${randomChatId}`);
			}
		},
		onError: (error) => {
			console.error("Error in chat:", error);
		},
	});

	// Calculate loading state
	const isLoading = status === "streaming" || status === "submitted";

	// Form submit handler
	const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!input.trim()) return;
		if (error != null) {
			setMessages(messages.slice(0, -1)); // remove last message
		}
		await handleSubmit(e);
	};

	// Stop generation handler
	const handleStopGeneration = () => {
		stop();
		toast.info("Generation stopped", {
			description: "You can continue the conversation or start a new one.",
		});
		setTimeout(() => {
			inputRef.current?.focus();
		}, 100);
	};

	// Let parent handle loading state
	if (isLoadingMessage) {
		return null;
	}

	// Render chat view
	return (
		<ChatView
			messages={messages}
			input={input}
			handleInputChange={handleInputChange}
			handleSubmit={handleFormSubmit}
			handleStopGeneration={handleStopGeneration}
			isLoading={isLoading}
			error={error || null}
			reload={reload}
		/>
	);
}
