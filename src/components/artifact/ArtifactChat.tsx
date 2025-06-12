// components/artifact/ArtifactChat.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiProvider } from "@/context/api-provider-context";
import { useMcpEnabled } from "@/hooks/use-mcp-enabled";
import { ArtifactChatList } from "./ArtifactChatList";
import { ChatInput } from "../chat/chat-input";
import { ArtifactMessage } from "./ArtifactMessage";
import { Thinking } from "../chat/thinking";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom-mutation";

interface ArtifactChatProps {
	chatId: string;
	className?: string;
}

export function ArtifactChat({ chatId, className }: ArtifactChatProps) {
	const queryClient = useQueryClient();
	const { currentProvider, currentModel } = useApiProvider();
	const { mcpEnabled, toggleMcpEnabled } = useMcpEnabled();
	const [isUploading, setIsUploading] = useState(false);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	const { scrollAreaRef, endRef, isAtBottom, scrollToBottom } =
		useScrollToBottom({
			bottomThreshold: 100,
			scrollOnMount: true,
			forceScrollOnNewContent: false,
		});

	// 使用 useChat hook 管理聊天状态
	const {
		messages,
		input,
		handleInputChange,
		handleSubmit,
		status,
		stop,
		error,
		reload,
	} = useChat({
		id: chatId,
		maxSteps: 10,
		experimental_prepareRequestBody: (body) => {
			if (!currentProvider) {
				throw new Error("Please configure API provider first");
			}

			if (!currentModel) {
				throw new Error("Please select a model");
			}

			return {
				chatId: chatId,
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
			console.log("Artifact chat message finished:", message);
			// 刷新聊天列表和主聊天查询
			queryClient.invalidateQueries({
				queryKey: ["chats", "user-id"],
			});
			queryClient.invalidateQueries({
				queryKey: ["artifact-chat", "user-id", chatId],
			});
		},
		onError: (error) => {
			console.error("Artifact chat error:", error);
			toast.error("Chat error", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		},
	});

	// 表单提交处理器
	const handleFormSubmit = async (
		e: React.FormEvent<HTMLFormElement>,
		options?: { experimental_attachments?: FileList },
	) => {
		e.preventDefault();

		if (!input.trim() && !options?.experimental_attachments) return;

		// 防止多次提交
		if (status === "streaming" || status === "submitted" || isUploading) {
			return;
		}

		try {
			handleSubmit(e, options);
		} catch (error) {
			toast.error("Failed to send message", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	// 停止生成处理器
	const handleStopGeneration = () => {
		stop();
		toast.info("Generation stopped");
		setTimeout(() => {
			inputRef.current?.focus();
		}, 100);
	};

	// 自动滚动到底部
	useEffect(() => {
		if (messages.length > 0 && isAtBottom) {
			scrollToBottom();
		}
	}, [messages, isAtBottom, scrollToBottom]);

	return (
		<div className={`flex flex-col h-full ${className || ""}`}>
			{/* 消息列表区域 */}
			<div ref={scrollAreaRef} className="flex-1 overflow-y-auto">
				{messages.length === 0 ? (
					<div className="flex-1 flex items-center justify-center h-full">
						<div className="text-center">
							<p className="text-sm text-muted-foreground">开始新的对话</p>
							<p className="text-xs text-muted-foreground mt-1">
								在这里与 AI 进行交流
							</p>
						</div>
					</div>
				) : (
					<div className="space-y-0">
						{messages.map((message, index) => {
							const isLastMessage = index === messages.length - 1;
							return (
								<ArtifactMessage
									key={message.id}
									message={message}
									isLoading={status === "streaming" && isLastMessage}
								/>
							);
						})}
						<div ref={endRef} />
					</div>
				)}
			</div>

			{/* 思考状态 */}
			{status === "submitted" && (
				<div className="px-3 py-2">
					<Thinking />
				</div>
			)}

			{/* 聊天输入区域 */}
			<div className="border-t border-border-/50 bg-background/50">
				<ChatInput
					input={input}
					handleInputChange={handleInputChange}
					handleSubmit={handleFormSubmit}
					handleStopGeneration={handleStopGeneration}
					mcpEnabled={mcpEnabled}
					toggleMcpEnabled={toggleMcpEnabled}
					status={status}
					isUploading={isUploading}
					className="p-2 max-w-none" // 调整样式以适合侧边栏
				/>
			</div>

			{/* 错误显示 */}
			{error && (
				<div className="px-3 py-2 bg-destructive/10 border-t border-destructive/20">
					<p className="text-xs text-destructive">Error: {error.message}</p>
					<button
						type="button"
						onClick={() => reload()}
						className="text-xs text-destructive underline mt-1"
					>
						Retry
					</button>
				</div>
			)}
		</div>
	);
}
