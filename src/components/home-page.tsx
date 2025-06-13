"use client";

import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { nanoid } from "nanoid";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiProvider } from "@/context/api-provider-context";
import { useMcpEnabled } from "@/hooks/use-mcp-enabled";
import { ChatInput } from "@/components/chat/chat-input";

export function HomePage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { currentProvider, currentModel, isConfigured } = useApiProvider();
	const { mcpEnabled, toggleMcpEnabled } = useMcpEnabled();
	const [randomChatId] = useState<string>(() => nanoid(16));
	const [isUploading, setIsUploading] = useState(false);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	// Use AI chat hooks for new chat
	const { input, handleInputChange, handleSubmit, status, stop, error } =
		useChat({
			id: randomChatId,
			maxSteps: 10,
			experimental_prepareRequestBody: (body) => {
				// 检查提供商和模型是否已配置
				if (!currentProvider) {
					throw new Error("Please configure API provider first");
				}

				if (!currentModel) {
					throw new Error("Please select a model");
				}

				return {
					chatId: randomChatId,
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
			// Submit first to start the chat
			handleSubmit(e, options);

			// Navigate to the new chat after a brief delay
			setTimeout(() => {
				router.push(`/chat/${randomChatId}`);

				// Update query cache to refresh sidebar chat list
				queryClient.invalidateQueries({
					queryKey: ["chats", "user-id"],
				});
			}, 100);
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
					{/* Welcome header */}
					<div className="text-center space-y-6">
						<div className="space-y-4">
							<h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">
								MegaCloud MCP
							</h1>
							<p className="text-xl md:text-2xl text-foreground/70 font-medium">
								AI Assistant with Model Context Protocol
							</p>
						</div>

						<div className="max-w-2xl mx-auto space-y-4">
							<p className="text-lg text-muted-foreground leading-relaxed">
								Experience intelligent conversations powered by advanced AI
								models and seamless context understanding.
							</p>

							{/* Status indicator */}
							<div className="flex items-center justify-center">
								{!isConfigured ? (
									<div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 border-solid dark:border-amber-800 rounded-full">
										<div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
										<span className="text-sm font-medium text-amber-700 dark:text-amber-400">
											Configuration required
										</span>
									</div>
								) : (
									<div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/20 border border-green-200 border-solid dark:border-green-800 rounded-full">
										<div className="w-2 h-2 bg-green-500 rounded-full" />
										<span className="text-sm font-medium text-green-700 dark:text-green-400">
											Ready with {currentModel}
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
								handleInputChange={handleInputChange}
								handleSubmit={handleFormSubmit}
								handleStopGeneration={handleStopGeneration}
								mcpEnabled={mcpEnabled}
								toggleMcpEnabled={toggleMcpEnabled}
								status={status}
								isUploading={isUploading}
							/>
						</div>
						<div className="text-center mt-4">
							<p className="text-sm text-muted-foreground">
								Start typing your message to begin a new conversation
							</p>
						</div>
					</div>

					{/* Feature highlights */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="text-center space-y-4 p-6 rounded-xl bg-card/50 border border-border-/50 hover:bg-card/80 transition-all duration-200 hover:shadow-md">
							<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
								<svg
									className="w-6 h-6 text-primary"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-label="Fast and intelligent"
								>
									<title>Fast and intelligent</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
							</div>
							<div className="space-y-2">
								<h3 className="font-semibold text-foreground">
									Fast & Intelligent
								</h3>
								<p className="text-sm text-muted-foreground">
									Lightning-fast responses with context-aware AI models
								</p>
							</div>
						</div>

						<div className="text-center space-y-4 p-6 rounded-xl bg-card/50 border border-border-/50 hover:bg-card/80 transition-all duration-200 hover:shadow-md">
							<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
								<svg
									className="w-6 h-6 text-primary"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-label="Secure and private"
								>
									<title>Secure and private</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
									/>
								</svg>
							</div>
							<div className="space-y-2">
								<h3 className="font-semibold text-foreground">
									Secure & Private
								</h3>
								<p className="text-sm text-muted-foreground">
									Your conversations are protected with enterprise-grade
									security
								</p>
							</div>
						</div>

						<div className="text-center space-y-4 p-6 rounded-xl bg-card/50 border border-border-/50 hover:bg-card/80 transition-all duration-200 hover:shadow-md">
							<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
								<svg
									className="w-6 h-6 text-primary"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-label="MCP"
								>
									<title>MCP</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
									/>
								</svg>
							</div>
							<div className="space-y-2">
								<h3 className="font-semibold text-foreground">MCP</h3>
								<p className="text-sm text-muted-foreground">
									Advanced Model Context Protocol for seamless integrations
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="flex-shrink-0 py-6 px-4">
				<div className="text-center">
					<p className="text-xs text-muted-foreground">
						Powered by AI • Built with Next.js
					</p>
				</div>
			</div>
		</div>
	);
}
