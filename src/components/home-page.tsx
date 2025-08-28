"use client";

import { ChatInput } from "@/components/chat/chat-input";
import { useApiProvider } from "@/context/api-provider-context";
import { useChatFlow } from "@/context/chat-flow-context";
import { useMcpEnabled } from "@/hooks/use-mcp-enabled";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function HomePage() {
  const t = useTranslations("HomePage");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentProvider, currentModel, isConfigured } = useApiProvider();
  const { mcpEnabled, toggleMcpEnabled } = useMcpEnabled();
  const [randomChatId] = useState<string>(() => nanoid(16));
  const [isUploading, setIsUploading] = useState(false);
  const [input, setInput] = useState<string>("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { setPendingMessage } = useChatFlow();

  // Use the same chat ID to ensure state sharing with Chat component
  const chatIdToUse = randomChatId;

  // Use AI chat hooks for new chat - AI SDK 5 compatible
  const chat = useChat({
    id: chatIdToUse, // Use consistent chat ID for state sharing
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({
        messages,
        id,
        body,
      }: {
        messages: UIMessage[];
        id: string;
        body?: Record<string, unknown>;
      }) => {
        return {
          body: {
            id,
            message: messages.at(-1),
            chatId: chatIdToUse, // Use consistent chat ID
            userId: "user-id",
            apiKey: currentProvider?.apiKey,
            modelName: currentModel || "gpt-4o-mini",
            baseUrl: currentProvider?.baseUrl,
            mcpEnabled: mcpEnabled,
            providerType: currentProvider?.providerType,
            ...body,
          },
        };
      },
    }),
    onFinish: () => {
      // Update query cache to refresh sidebar chat list
      queryClient.invalidateQueries({
        queryKey: ["chats", "user-id", "recent"],
      });
    },
    onError: (error: Error) => {
      console.error("Chat error:", error);
      toast.error("Chat error", {
        description: error.message,
      });
    },
  });

  const { messages, sendMessage, status, stop } = chat;

  // Calculate loading state based on status
  const isStatusLoading = status === "streaming" || status === "submitted";

  // We will navigate immediately on submit and start streaming in Chat page.
  // (Remove auto-navigation based on streaming status to avoid losing stream state.)

  // Form submit handler
  const handleFormSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    options?: { experimental_attachments?: FileList }
  ) => {
    e.preventDefault();
    if (!input?.trim() && !options?.experimental_attachments) return;

    // Prevent multiple submissions
    if (isStatusLoading || isUploading) {
      return;
    }

    // Check if provider and model are configured
    if (!currentProvider) {
      toast.error("Please configure API provider first");
      return;
    }

    try {
      // First, create a new chat record
      const createResponse = await fetch("/api/chats/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "user-id",
          title: "New Chat",
          message: input,
          modelName: currentModel,
          apiKey: currentProvider?.apiKey,
          baseUrl: currentProvider?.baseUrl,
          providerType: currentProvider?.providerType,
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create chat");
      }

      const { chat } = await createResponse.json();
      const newChatId = chat.id;

      // Stash pending message into in-memory context, then navigate.
      setPendingMessage(newChatId, {
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

      // Immediately refresh the chat list to show the new chat
      queryClient.invalidateQueries({
        queryKey: ["chats", "user-id", "recent"],
      });

      // Clear the input before navigation
      setInput("");

      // Navigate to the new chat
      router.push(`/chat/${newChatId}`, { scroll: false });
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

  return (
    <div className="flex flex-col h-full min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Main content with centered layout */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl mx-auto space-y-12">
          {/* Welcome header with enhanced design */}
          <div className="text-center space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-primary to-emerald-600 dark:from-blue-400 dark:via-primary dark:to-emerald-400 bg-clip-text text-transparent">
                {t("title")}
              </h1>
              <p className="text-xl md:text-2xl text-foreground/80 font-medium max-w-3xl mx-auto">
                {t("description")}
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-gradient-to-r from-blue-50/50 via-primary/5 to-emerald-50/50 dark:from-blue-950/30 dark:via-primary/10 dark:to-emerald-950/30 p-6 rounded-2xl border border-blue-100/20 dark:border-blue-800/20">
                <p className="text-lg text-foreground/90 leading-relaxed">
                  {t("welcome")}
                </p>
              </div>

              {/* Status indicator with enhanced design */}
              <div className="flex items-center justify-center">
                {!isConfigured ? (
                  <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 border-solid dark:border-amber-800/50 rounded-full shadow-sm">
                    <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      {t("configurationRequired")}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-5 py-3 bg-green-50 dark:bg-green-950/30 border border-green-200 border-solid dark:border-green-800/50 rounded-full shadow-sm">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      {t("readyWith", { model: currentModel })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Centered chat input */}
          <div className="w-full max-w-3xl mx-auto">
            <div className="relative">
              <ChatInput
                input={input}
                handleInputChange={(e) => setInput(e.target.value)}
                handleSubmit={handleFormSubmit}
                handleStopGeneration={handleStopGeneration}
                mcpEnabled={mcpEnabled}
                toggleMcpEnabled={toggleMcpEnabled}
                status={status as "error" | "submitted" | "streaming" | "ready"}
                isUploading={isUploading}
              />
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                {t("startConversation")}
              </p>
            </div>
          </div>

          {/* Feature highlights - 2x2 grid for better emphasis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* MCP Feature - Primary highlight */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-blue-50/50 to-indigo-50 dark:from-blue-950/20 dark:via-blue-900/10 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/30 p-8 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="MCP Protocol"
                  >
                    <title>MCP Protocol</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {t("features.mcp.title")}
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                    {t("features.mcp.description")}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                      {t("features.mcp.tags.0")}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                      {t("features.mcp.tags.1")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Artifact Feature - Primary highlight */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-teal-50 dark:from-emerald-950/20 dark:via-emerald-900/10 dark:to-teal-950/20 border border-emerald-200/50 dark:border-emerald-800/30 p-8 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="Artifacts"
                  >
                    <title>Artifacts</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {t("features.artifacts.title")}
                  </h3>
                  <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">
                    {t("features.artifacts.description")}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 text-xs font-medium rounded-full">
                      {t("features.artifacts.tags.0")}
                    </span>
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 text-xs font-medium rounded-full">
                      {t("features.artifacts.tags.1")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Models Feature */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-purple-50/50 to-pink-50 dark:from-purple-950/20 dark:via-purple-900/10 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/30 p-8 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="AI Models"
                  >
                    <title>AI Models</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {t("features.ai.title")}
                  </h3>
                  <p className="text-purple-700 dark:text-purple-300 leading-relaxed">
                    {t("features.ai.description")}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs font-medium rounded-full">
                      {t("features.ai.tags.0")}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs font-medium rounded-full">
                      {t("features.ai.tags.1")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Management Feature */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-amber-50/50 to-orange-50 dark:from-amber-950/20 dark:via-amber-900/10 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/30 p-8 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="Chat Management"
                  >
                    <title>Chat Management</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                    {t("features.chat.title")}
                  </h3>
                  <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
                    {t("features.chat.description")}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-full">
                      {t("features.chat.tags.0")}
                    </span>
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-full">
                      {t("features.chat.tags.1")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="flex-shrink-0 py-8 px-4 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>MCP Protocol</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span>Interactive Artifacts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>Multi-Provider AI</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Powered by Next.js • Enhanced with AI • Built for Developers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
