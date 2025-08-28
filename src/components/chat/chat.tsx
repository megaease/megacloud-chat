"use client";

import { ArtifactChatPanel } from "@/components/artifact/ArtifactChatPanel";
import { ArtifactContentPanel } from "@/components/artifact/ArtifactContentPanel";
import { ArtifactModal } from "@/components/artifact/ArtifactModal";
import { useApiProvider } from "@/context/api-provider-context";
import { ArtifactProvider } from "@/context/artifact-provider-context";
import { useChatFlow } from "@/context/chat-flow-context";
import { useEditMessage } from "@/hooks/use-edit-message";
import { useMcpEnabled } from "@/hooks/use-mcp-enabled";
import type { DBMessage } from "@/server/db/schema";
import { useChat } from "@ai-sdk/react";
import { IconLoader2 } from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import type { UIMessage, DataUIPart } from "ai";
import { nanoid } from "nanoid";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DataStreamProvider } from "../data-stream-provider";
import { DataStreamHandler } from "../data-stream-handler";
import { ArtifactOpener } from "./ArtifactOpener";
import { ChatView } from "./chat-view";
import { useDataStream } from "../data-stream-provider";
import type { StreamDelta } from "@/types/stream-delta";

// Helper function to get message content safely
function getMessageContent(message: UIMessage): string {
  // Try to get content from the legacy content field first
  if ((message as unknown as Record<string, unknown>).content) {
    const content = (message as unknown as Record<string, unknown>).content;
    return typeof content === "string" ? content : JSON.stringify(content);
  }

  // Try to extract text from parts
  if (message.parts && Array.isArray(message.parts)) {
    const textParts = message.parts
      .filter(
        (part: unknown) => (part as Record<string, unknown>)?.type === "text"
      )
      .map((part: unknown) => (part as Record<string, unknown>).text)
      .filter(Boolean) as string[];

    if (textParts.length > 0) {
      return textParts.join("");
    }
  }

  return "";
}

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

      try {
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
      } catch (error) {
        // If there's a network error or other issue, check if it's a 404
        if (error instanceof Error && error.message.includes("404")) {
          return []; // Return empty array for new chats
        }
        throw error; // Re-throw other errors
      }
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
  const [input, setInput] = useState<string>("");
  const { consumePendingMessage } = useChatFlow();

  // Ensure we have a valid chatId for components that require it
  const effectiveChatId = chatId || randomChatId || "";

  const { setDataStream } = useDataStream();

  // 使用 ref 来保存最新的模型和提供者信息
  const providerRef = useRef({
    currentProvider,
    currentModel,
    mcpEnabled,
  });

  // 当模型或提供者改变时更新 ref
  useEffect(() => {
    providerRef.current = {
      currentProvider,
      currentModel,
      mcpEnabled,
    };
  }, [currentProvider, currentModel, mcpEnabled]);

  // 创建 prepareSendMessagesRequest 函数
  const prepareSendMessagesRequest = ({
    messages,
    id,
    body,
  }: {
    messages: UIMessage[];
    id: string;
    body?: Record<string, unknown>;
  }) => {
    // 从 ref 中获取最新的提供者和模型信息
    const { currentProvider, currentModel, mcpEnabled } = providerRef.current;

    // Check if provider and model are configured
    if (!currentProvider) {
      throw new Error("Please configure API provider first");
    }

    if (!currentModel) {
      throw new Error("Please select a model");
    }

    return {
      body: {
        id,
        message: messages.at(-1),
        chatId: chatId || randomChatId,
        userId: "user-id",
        apiKey: currentProvider.apiKey,
        modelName: currentModel,
        baseUrl: currentProvider.baseUrl,
        mcpEnabled,
        providerType: currentProvider.providerType,
        ...body,
      },
    };
  };

  // Use AI chat hooks - AI SDK 5 compatible
  const chat = useChat({
    id: chatId || randomChatId,
    // 直接传递初始消息给 useChat，让 AI SDK 自动管理消息状态
    messages: chatMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest,
    }),
    onData: (dataPart) => {
      setDataStream((ds) => [...ds, dataPart]);
    },
    onFinish: (message) => {
      console.log("Message finished:", message);

      // Only handle routing for new chats that weren't created from homepage
      // Homepage navigation is handled in the homepage component itself
      // This prevents duplicate routing and maintains stream continuity

      // 失效聊天列表查询以刷新 sidebar
      queryClient.invalidateQueries({
        queryKey: ["chats", "user-id", "recent"],
      });
    },
    onError: (error) => {
      console.error("Error in chat:", JSON.stringify(error, null, 2));
      toast.error("Chat error", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  const { messages, sendMessage, status, stop } = chat;

  // 确保显示完整的聊天历史：优先使用数据库加载的消息，然后合并实时消息
  const effectiveMessages = useMemo(() => {
    // 如果没有实时消息，直接使用历史消息
    if (messages.length === 0) {
      return chatMessages;
    }

    // 如果有实时消息，确保包含完整的历史记录
    // 找出历史消息中在实时消息中不存在的部分
    const existingMessageIds = new Set(messages.map((m) => m.id));
    const missingHistoricalMessages = chatMessages.filter(
      (m) => !existingMessageIds.has(m.id)
    );

    // 合并消息：历史消息 + 实时消息
    return [...missingHistoricalMessages, ...messages];
  }, [messages, chatMessages]);

  // Set initial prompt from URL if this is a new chat for creating artifact
  useEffect(() => {
    // For new chats with createArtifact flag, set the initial prompt
    if (shouldCreateArtifact && effectiveMessages.length === 0 && setInput) {
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
  }, [shouldCreateArtifact, effectiveMessages.length, router]);

  // On first mount, if HomePage stashed a pending message, consume and send here.
  useEffect(() => {
    const effectiveId = chatId || randomChatId;
    if (!effectiveId) return;
    // Only auto-send when there are no messages yet to avoid duplicates
    if ((messages?.length ?? 0) > 0 || (chatMessages?.length ?? 0) > 0) return;
    try {
      const payload = consumePendingMessage(effectiveId);
      if (!payload) return;
      sendMessage(payload);
      setInput("");
    } catch (e) {
      console.error("Failed to consume pending message:", e);
    }
  }, [
    chatId,
    randomChatId,
    messages?.length,
    chatMessages?.length,
    consumePendingMessage,
    sendMessage,
  ]);

  // Calculate loading state
  const isLoading = status === "streaming" || status === "submitted";

  // Form submit handler
  const handleFormSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    options?: { experimental_attachments?: FileList }
  ) => {
    e.preventDefault();
    if ((!input || !input.trim()) && !options?.experimental_attachments) return;

    // Prevent multiple submissions
    if (isLoading || isUploading) {
      return;
    }

    try {
      // Submit the message using AI SDK 5 sendMessage pattern
      sendMessage({
        text: input,
        files: options?.experimental_attachments
          ? Array.from(options.experimental_attachments).map((file) => ({
              type: "file" as const,
              name: file.name,
              mediaType: file.type,
              url: URL.createObjectURL(file),
            }))
          : undefined,
      });

      // Clear the input after submission
      setInput("");

      // For new chats, handle the routing in onFinish callback
      // Don't navigate immediately to avoid losing stream state
    } catch (error) {
      toast.error("Failed to send message", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
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
      // Find the last user message to regenerate response
      const lastUserMessage = messages.filter((m) => m.role === "user").pop();
      if (lastUserMessage) {
        // Extract content from the message
        const messageContent = getMessageContent(lastUserMessage);
        if (messageContent) {
          // Send the message again to regenerate the response
          sendMessage({
            text: messageContent,
          });
        }
      }
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
    <>
      <ArtifactOpener artifactId={openArtifactId} />

      <ChatView
        messages={effectiveMessages}
        input={input}
        handleInputChange={(e) => setInput(e.target.value)}
        handleSubmit={handleFormSubmit}
        handleStopGeneration={handleStopGeneration}
        error={null}
        reload={handleRegenerate}
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

      <DataStreamHandler />
      <ArtifactModal
        chatPanel={
          <ArtifactChatPanel
            chatId={effectiveChatId}
            messages={effectiveMessages} // Use effectiveMessages to ensure initial messages are shown
            input={input}
            handleInputChange={(e) => setInput(e.target.value)}
            handleSubmit={handleFormSubmit}
            status={status}
            stop={stop}
            error={undefined}
            reload={handleRegenerate}
            isUploading={isUploading}
            mcpEnabled={mcpEnabled}
            toggleMcpEnabled={toggleMcpEnabled}
          />
        }
      >
        <ArtifactContentPanel />
      </ArtifactModal>
    </>
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
    <ArtifactProvider>
      <DataStreamProvider>
        <ChatContent
          chatId={chatId}
          chatMessages={chatMessages}
          shouldCreateArtifact={shouldCreateArtifact}
          openArtifactId={openArtifactId}
        />
      </DataStreamProvider>
    </ArtifactProvider>
  );
}
