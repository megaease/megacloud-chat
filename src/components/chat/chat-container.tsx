"use client";

import { useParams, useRouter } from "next/navigation";
import { useChat, type Message } from "@ai-sdk/react";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiSettings } from "@/context/api-settings-context";
import { useMcpEnabled } from "@/hooks/use-mcp-enabled";
import { ChatView } from "./chat-view";
import { Loader2 } from "lucide-react";
import { appendClientMessage, type UIMessage } from "ai";
import type { DBMessage } from "@/server/db/schema";

// Fetch chat messages hook
function useChatMessages(chatId: string | undefined) {
	const query = useQuery({
		queryKey: ["chats", "user-id", chatId],
		queryFn: async () => {
			// Don't fetch if no chatId (new chat)
			if (!chatId) {
				return [];
			}

			const res = await fetch(`/api/chats/${chatId}`, {
				headers: {
					userId: "user-id",
				},
			});

			// Handle 404 for new chats that don't exist yet
			if (!res.ok) {
				if (res.status === 404) {
					return []; // Return empty array for new chats
				}
				throw new Error(`Failed to fetch chat: ${res.status}`);
			}

			const data = await res.json();
			const uiMessages = data.chat.messages.map((message: DBMessage) => ({
				id: message.id,
				role: message.role,
				content: message.content,
				createdAt: new Date(message.createdAt),
				experimental_attachments: message.attachments || [],
				parts: message.parts || [],
			})) as UIMessage[];

			return uiMessages;
		},
		staleTime: 1000 * 60 * 2,
		enabled: !!chatId, // Only fetch when chatId exists
		refetchOnWindowFocus: false,
		retry: (failureCount, error) => {
			// Don't retry on 404 errors (new chat doesn't exist yet)
			if (error instanceof Error && error.message.includes("404")) {
				return false;
			}
			return failureCount < 3;
		},
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
	const { mcpEnabled, toggleMcpEnabled } = useMcpEnabled();
	const [randomChatId, setRandomChatId] = useState<string | undefined>(() => {
		if (!chatId) {
			return nanoid(16);
		}
		return undefined;
	});
	const inputRef = useRef<HTMLTextAreaElement>(null);

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
		initialMessages: chatMessages,
		experimental_prepareRequestBody: (body) => {
			return {
				chatId: chatId || randomChatId,
				userId: "user-id",
				apiKey,
				modelName,
				baseUrl,
				mcpEnabled,
				message: body.messages.at(-1),
			};
		},
		experimental_throttle: 100,
		sendExtraMessageFields: true,
		onFinish: (message) => {
			console.log("Message finished:", message);
			queryClient.invalidateQueries({
				queryKey: ["chats", "user-id"],
			});
		},
		onError: (error) => {
			console.error("Error in chat:", JSON.stringify(error, null, 2));

			toast.error("Chat error", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		},
	});

	// Calculate loading state
	const isLoading = status === "streaming" || status === "submitted";

	// Form submit handler with improved routing
	const handleFormSubmit = (
		e: React.FormEvent<HTMLFormElement>,
		options?: { experimental_attachments?: FileList },
	) => {
		e.preventDefault();
		if (!input.trim()) return;

		// Prevent multiple submissions
		if (isLoading) {
			return;
		}

		// If we have an existing chatId, just submit normally
		if (chatId) {
			handleSubmit(e, options);
			return;
		}

		// For new chats, we need to handle the routing more smoothly
		if (!chatId && randomChatId) {
			// Submit first to prevent interruption by route change
			handleSubmit(e, options);

			// Then handle route change after a brief delay
			setTimeout(() => {
				router.push(`/chat/${randomChatId}`, {
					scroll: false, // Prevent scroll jumping
				});

				// Update query cache to refresh sidebar chat list
				queryClient.invalidateQueries({
					queryKey: ["chats", "user-id"],
				});
			}, 100);
			return;
		}
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

	if (isLoadingMessage) {
		return (
			<div className="flex items-center justify-center h-full">
				<Loader2 className="animate-spin text-primary" />
			</div>
		);
	}
	// Render chat view
	console.log("Rendering chat view with messages:", messages);
	return (
		<ChatView
			messages={messages}
			input={input}
			handleInputChange={handleInputChange}
			handleSubmit={handleFormSubmit}
			handleStopGeneration={handleStopGeneration}
			error={error || null}
			reload={reload}
			mcpEnabled={mcpEnabled}
			toggleMcpEnabled={toggleMcpEnabled}
			status={status}
		/>
	);
}
