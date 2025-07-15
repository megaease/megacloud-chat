"use client";

import { useParams, useRouter } from "next/navigation";
import { useChat, type Message } from "@ai-sdk/react";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useApiProvider } from "@/context/api-provider-context";
import { useMcpEnabled } from "@/hooks/use-mcp-enabled";
import { ChatView } from "./chat-view";
import { IconLoader2 } from "@tabler/icons-react";
import { appendClientMessage, type UIMessage } from "ai";
import type { DBMessage } from "@/server/db/schema";
import { DataStreamHandler } from "../artifact/DataStreamHandler";
import { ArtifactModal } from "@/components/artifact/ArtifactModal";
import { ArtifactChatPanel } from "@/components/artifact/ArtifactChatPanel";
import { ArtifactContentPanel } from "@/components/artifact/ArtifactContentPanel";
import { ArtifactProvider } from "@/context/artifact-provider-context";

// Fetch chat messages hook
function useChatMessages(chatId: string | undefined) {
	const query = useQuery({
		queryKey: ["chats", "user-id", chatId],
		queryFn: async () => {
			// Don't fetch if no chatId (new chat)
			if (!chatId) {
				return [];
			}
			
			// Check if this is a new chat for creating artifact (to avoid 404)
			if (typeof window !== 'undefined') {
				const urlParams = new URLSearchParams(window.location.search);
				if (urlParams.get('createArtifact') === 'true') {
					return []; // Return empty for new artifact creation
				}
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
export function Chat() {
	const { id } = useParams();
	const chatId = id as string;
	const router = useRouter();
	const queryClient = useQueryClient();
	const { currentProvider, currentModel } = useApiProvider();
	const { mcpEnabled, toggleMcpEnabled } = useMcpEnabled();
	const [randomChatId] = useState<string | undefined>(() => {
		if (!chatId) {
			return nanoid(16);
		}
		return undefined;
	});
	const [isUploading] = useState(false);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	
	// Get createArtifact flag from URL search params
	const [shouldCreateArtifact, setShouldCreateArtifact] = useState(false);
	
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const urlParams = new URLSearchParams(window.location.search);
			const createArtifact = urlParams.get('createArtifact') === 'true';
			setShouldCreateArtifact(createArtifact);
		}
	}, []);

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
		input,
		setInput,
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
			// Check if provider and model are configured
			if (!currentProvider) {
				throw new Error("Please configure API provider first");
			}

			if (!currentModel) {
				throw new Error("Please select a model");
			}

			return {
				chatId: chatId || randomChatId,
				userId: "user-id",
				apiKey: currentProvider.apiKey,
				modelName: currentModel,
				baseUrl: currentProvider.baseUrl,
				mcpEnabled,
				message: body.messages.at(-1),
				providerType: currentProvider.providerType,
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

	// Set initial prompt from URL if this is a new chat for creating artifact
	useEffect(() => {
		// For new chats with createArtifact flag, set the initial prompt
		if (shouldCreateArtifact && messages.length === 0 && setInput) {
			const defaultPrompt = "Please help me create a new Artifact. I want:\n\n1. Type: [text/code/table/image]\n2. Content: [describe what you want to create]\n3. Features: [specific requirements]\n\nExample: Create a React component that implements a todo list";
			setInput(defaultPrompt);
			
			// Clear the URL parameter to avoid re-setting on refresh
			if (typeof window !== 'undefined') {
				const url = new URL(window.location.href);
				url.searchParams.delete('createArtifact');
				router.replace(url.pathname + url.search, { scroll: false });
			}
		}
	}, [shouldCreateArtifact, messages.length, setInput, router]);

	// Calculate loading state
	const isLoading = status === "streaming" || status === "submitted";

	// Form submit handler
	const handleFormSubmit = async (
		e: React.FormEvent<HTMLFormElement>,
		options?: { experimental_attachments?: FileList },
	) => {
		e.preventDefault();
		if (!input.trim() && !options?.experimental_attachments) return;

		// Prevent multiple submissions
		if (isLoading || isUploading) {
			return;
		}

		try {
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
		} catch (error) {
			toast.error("Failed to process request", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
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
			<div className="flex h-full w-full flex-col items-center justify-center gap-2">
				<IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<ArtifactProvider>
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
				isUploading={isUploading}
			/>

			<DataStreamHandler chatId={chatId} />
			<ArtifactModal
				chatPanel={
					<ArtifactChatPanel
						chatId={chatId}
						messages={messages}
						input={input}
						handleInputChange={handleInputChange}
						handleSubmit={handleFormSubmit}
						status={status}
						stop={stop}
						error={error}
						reload={reload}
						isUploading={isUploading}
						mcpEnabled={mcpEnabled}
						toggleMcpEnabled={toggleMcpEnabled}
					/>
				}
			>
				<ArtifactContentPanel />
			</ArtifactModal>
		</ArtifactProvider>
	);
}
