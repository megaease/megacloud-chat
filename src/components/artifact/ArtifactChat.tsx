// components/artifact/ArtifactChat.tsx
"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@ai-sdk/react";
import { toast } from "sonner";
import { ArtifactChatList } from "./ArtifactChatList";
import { ChatInput } from "../chat/chat-input";
import { ArtifactMessage } from "./ArtifactMessage";
import { Thinking } from "../chat/thinking";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom-mutation";

interface ArtifactChatProps {
	chatId: string;
	className?: string;
	// 来自父组件的聊天状态
	messages: Message[];
	input: string;
	handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	handleSubmit: (
		e: React.FormEvent<HTMLFormElement>,
		options?: { experimental_attachments?: FileList }
	) => void;
	status: "error" | "submitted" | "streaming" | "ready";
	stop: () => void;
	error: Error | undefined;
	reload: () => void;
	isUploading: boolean;
	mcpEnabled: boolean;
	toggleMcpEnabled: () => boolean;
}

export function ArtifactChat({ 
	chatId, 
	className,
	messages,
	input,
	handleInputChange,
	handleSubmit,
	status,
	stop,
	error,
	reload,
	isUploading,
	mcpEnabled,
	toggleMcpEnabled
}: ArtifactChatProps) {
	const inputRef = useRef<HTMLTextAreaElement>(null);

	const { scrollAreaRef, endRef, isAtBottom, scrollToBottom } =
		useScrollToBottom({
			bottomThreshold: 100,
			scrollOnMount: true,
			forceScrollOnNewContent: false,
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
