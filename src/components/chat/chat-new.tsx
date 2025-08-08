"use client";

import { useParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiProvider } from "@/context/api-provider-context";
import { useMcpEnabled } from "@/hooks/use-mcp-enabled";
import { useEditMessage } from "@/hooks/use-edit-message";
import { ChatView } from "./chat-view";
import { IconLoader2 } from "@tabler/icons-react";
import type { UIMessage } from "ai";
import type { DBMessage } from "@/server/db/schema";
import { DataStreamHandler } from "../artifact/DataStreamHandler";
import { ArtifactModal } from "@/components/artifact/ArtifactModal";
import { ArtifactChatPanel } from "@/components/artifact/ArtifactChatPanel";
import { ArtifactContentPanel } from "@/components/artifact/ArtifactContentPanel";
import { ArtifactProvider } from "@/context/artifact-provider-context";
import { ArtifactOpener } from "./ArtifactOpener";
import { useChatFlow } from "@/context/chat-flow-context";

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
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("createArtifact") === "true") {
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

// Chat content component that handles the actual chat logic
function ChatContent({
  chatId,
  chatMessages,
  shouldCreateArtifact,
  openArtifactId,
}: {
  chatId: string | undefined;
  chatMessages: UIMessage[];
  shouldCreateArtifact: boolean;
  openArtifactId: string | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentProvider, currentModel } = useApiProvider();
  const { mcpEnabled, toggleMcpEnabled } = useMcpEnabled();
  const { editMessage } = useEditMessage();
  const [randomChatId] = useState<string | undefined>(() => {
    if (!chatId) {
      return nanoid(16);
    }
    return undefined;
  });
  const [isUploading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const { consumePendingMessage } = useChatFlow();

  // Ensure we have a valid chatId for components that require it
  const effectiveChatId = chatId || randomChatId || "";

  // Input state management
  const [input, setInput] = useState("");

  // Use AI chat hooks - AI SDK 5 format
  const {
    messages,
    setMessages,
    sendMessage,
    status: chatStatus,
    stop,
    regenerate,
    error,
  } = useChat({
    id: chatId || randomChatId,
    messages: chatMessages, // Initialize with existing messages
    experimental_throttle: 100,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages, id, body }) => {
        return {
          body: {
            id,
            message: messages.at(-1), // Send only the last message
            chatId: id,
            userId: "user-id", // TODO: Get from auth
            modelName: currentModel || "deepseek-chat", // Default to DeepSeek
            apiKey: currentProvider?.apiKey,
            baseUrl: currentProvider?.baseUrl,
            providerType: currentProvider?.id || "deepseek", // Default to DeepSeek
            mcpEnabled: mcpEnabled,
            ...body,
          },
        };
      },
    }),
    onFinish: () => {
      // Invalidate queries to refresh chat list
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (error) => {
      console.error("Chat error:", error);
      // TODO: Add toast notification
    },
  });

  // Set initial prompt from URL if this is a new chat for creating artifact
  useEffect(() => {
    // For new chats with createArtifact flag, set the initial prompt
    if (shouldCreateArtifact && messages.length === 0) {
      const defaultPrompt =
        "Please help me create a new Artifact. I want:\n\n1. Type: [text/code/table/image]\n2. Content: [describe what you want to create]\n3. Features: [specific requirements]\n\nExample: Create a React component that implements a todo list";
      setInput(defaultPrompt);

      // Clear the URL parameter to avoid re-setting on refresh
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("createArtifact");
        router.replace(url.pathname + url.search, { scroll: false });
      }
    }
  }, [shouldCreateArtifact, messages.length, router]);

  // If HomePage stashed a pending message, start streaming here
  useEffect(() => {
    const effectiveId = chatId || randomChatId;
    if (!effectiveId) return;
    if ((messages?.length ?? 0) > 0) return;
    const payload = consumePendingMessage(effectiveId);
    if (!payload) return;
    sendMessage(payload);
    setInput("");
  }, [
    chatId,
    randomChatId,
    messages?.length,
    consumePendingMessage,
    sendMessage,
  ]);

  // Input handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (
    e: React.FormEvent,
    options?: { experimental_attachments?: FileList }
  ) => {
    e.preventDefault();
    if (!input?.trim() && !options?.experimental_attachments) return;

    // Check if provider and model are configured
    if (!currentProvider) {
      toast.error("Please configure API provider first");
      return;
    }

    if (!currentModel) {
      toast.error("Please select a model");
      return;
    }

    try {
      // Use AI SDK 5's sendMessage function
      await sendMessage({
        text: input,
      });
      setInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Calculate status based on loading and error states
  const isChatLoading =
    chatStatus === "submitted" || chatStatus === "streaming";
  const status: "error" | "submitted" | "streaming" | "ready" = chatStatus;

  // Calculate loading state
  const isLoading = isChatLoading;

  // Form submit handler
  const handleFormSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    options?: { experimental_attachments?: FileList }
  ) => {
    e.preventDefault();
    if (!input?.trim() && !options?.experimental_attachments) return;

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
            queryKey: ["chats", "user-id", "recent"],
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

  // Handle retry for failed requests
  const handleRetry = () => {
    if (messages.length > 0) {
      // Get the last user message
      const lastUserMessage = messages.filter((m) => m.role === "user").pop();
      if (lastUserMessage) {
        // Extract content safely from AI SDK 5 message format
        let messageContent = "";
        if (lastUserMessage.parts && Array.isArray(lastUserMessage.parts)) {
          const textParts = lastUserMessage.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .filter(Boolean);
          messageContent = textParts.join("");
        }

        // Set the input field and trigger a new submission
        setInput(messageContent);

        // Use setTimeout to ensure the input is set before submitting
        setTimeout(() => {
          // Create a form submission event
          const form = document.querySelector("form");
          if (form) {
            const submitEvent = new Event("submit", {
              bubbles: true,
              cancelable: true,
            });
            form.dispatchEvent(submitEvent);
          }

          toast.info("重试中...", {
            description: "正在重新发送您的消息",
          });
        }, 100);
      }
    }
  };

  // Handle regenerate for successful responses
  const handleRegenerate = () => {
    if (messages.length > 0) {
      // Use the regenerate function from useChat to regenerate the last response
      regenerate();
    }
  };

  // Handle edit message
  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      // 1. 保存到数据库
      await editMessage(messageId, newContent);

      // 2. 关闭编辑状态
      setEditingMessageId(null);

      // 3. 重新获取数据
      queryClient.invalidateQueries({
        queryKey: ["chats", "user-id", chatId],
      });

      // 4. 更新聊天列表
      queryClient.invalidateQueries({
        queryKey: ["chats", "user-id", "recent"],
      });
    } catch (error) {
      console.error("Failed to edit message:", error);
      throw error;
    }
  };

  // Handle start editing
  const handleStartEdit = (messageId: string) => {
    setEditingMessageId(messageId);
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    setEditingMessageId(null);
  };

  return (
    <ArtifactProvider>
      <ArtifactOpener artifactId={openArtifactId} />

      <ChatView
        messages={messages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleFormSubmit}
        handleStopGeneration={handleStopGeneration}
        error={error || null}
        reload={regenerate}
        retry={handleRetry}
        regenerate={handleRegenerate}
        mcpEnabled={mcpEnabled}
        toggleMcpEnabled={toggleMcpEnabled}
        status={status}
        isUploading={isUploading}
        onEditMessage={handleEditMessage}
        onStartEdit={handleStartEdit}
        onCancelEdit={handleCancelEdit}
        editingMessageId={editingMessageId}
      />

      <DataStreamHandler chatId={effectiveChatId} />
      <ArtifactModal
        chatPanel={
          <ArtifactChatPanel
            chatId={effectiveChatId}
            messages={messages} // Use messages from useChat
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleFormSubmit}
            status={status}
            stop={stop}
            error={error}
            reload={regenerate}
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

// Container component that handles data loading and conditional rendering
export function Chat() {
  const { id } = useParams();
  const chatId = id as string;

  // Get createArtifact flag from URL search params
  const [shouldCreateArtifact, setShouldCreateArtifact] = useState(false);
  const [openArtifactId, setOpenArtifactId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const createArtifact = urlParams.get("createArtifact") === "true";
      const openArtifact = urlParams.get("openArtifact");

      setShouldCreateArtifact(createArtifact);
      setOpenArtifactId(openArtifact);
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

  // Show loading state while messages are being fetched
  if (isLoadingMessage) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Only render ChatContent when messages are loaded
  // This ensures useChat gets the correct initialMessages
  return (
    <ChatContent
      chatId={chatId}
      chatMessages={chatMessages}
      shouldCreateArtifact={shouldCreateArtifact}
      openArtifactId={openArtifactId}
    />
  );
}
