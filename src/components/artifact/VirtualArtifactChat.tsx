// components/artifact/VirtualArtifactChat.tsx
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { Message } from "@ai-sdk/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatInput } from "../chat/chat-input";
import { ArtifactMessage } from "./ArtifactMessage";

interface VirtualArtifactChatProps {
	className?: string;
	chatId?: string;
	// Chat state from parent component
	messages: Message[];
	input: string;
	handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	handleSubmit: (
		e: React.FormEvent<HTMLFormElement>,
		options?: { experimental_attachments?: FileList },
	) => void;
	status: "error" | "submitted" | "streaming" | "ready";
	stop: () => void;
	error: Error | undefined;
	reload: () => void;
	isUploading: boolean;
	mcpEnabled: boolean;
	toggleMcpEnabled: () => boolean;
}

// 估算 Artifact 消息高度的函数
const estimateArtifactMessageSize = (message: Message): number => {
	// 基础高度
	let baseHeight = 80;
	
	// 根据角色调整
	if (message.role === "assistant") {
		baseHeight = 120;
	} else if (message.role === "system") {
		baseHeight = 60;
	}
	
	// 根据内容长度调整
	const contentLength = message.content?.length || 0;
	if (contentLength > 500) {
		baseHeight += Math.min(Math.floor(contentLength / 200) * 30, 200);
	} else if (contentLength > 100) {
		baseHeight += Math.floor(contentLength / 100) * 15;
	}
	
	// 检查是否有附件
	if (message.experimental_attachments && message.experimental_attachments.length > 0) {
		baseHeight += message.experimental_attachments.length * 60;
	}
	
	// 检查是否有工具调用
	if (message.toolInvocations && message.toolInvocations.length > 0) {
		baseHeight += message.toolInvocations.length * 100;
	}
	
	// 检查是否有代码块 (粗略估算)
	const codeBlockCount = (message.content?.match(/```/g) || []).length / 2;
	if (codeBlockCount > 0) {
		baseHeight += codeBlockCount * 120;
	}
	
	return Math.max(baseHeight, 60); // 最小高度
};

export function VirtualArtifactChat({
	className,
	chatId,
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
	toggleMcpEnabled,
}: VirtualArtifactChatProps) {
	// 虚拟滚动容器的引用
	const parentRef = useRef<HTMLDivElement>(null);

	// 创建虚拟化器
	const virtualizer = useVirtualizer({
		count: messages.length,
		getScrollElement: () => parentRef.current,
		estimateSize: useCallback((index: number) => {
			const message = messages[index];
			if (!message) return 100; // 默认高度
			return estimateArtifactMessageSize(message);
		}, [messages]),
		overscan: 3, // Artifact 聊天中预渲染3个项目
		// 启用动态大小调整
		measureElement: (element) => {
			// 返回元素的实际高度，用于精确测量
			return element?.getBoundingClientRect().height ?? 0;
		},
	});

	// 自动滚动到底部 - 优化版本
	const scrollToBottom = useCallback(() => {
		if (messages.length === 0) return;
		
		try {
			// 方法1: 使用 virtualizer 的 scrollToIndex
			virtualizer.scrollToIndex(messages.length - 1, {
				align: 'end',
				behavior: 'smooth',
			});
		} catch (error) {
			// 方法2: fallback 到直接滚动
			console.warn('Virtualizer scrollToIndex failed, using fallback:', error);
			if (parentRef.current) {
				parentRef.current.scrollTop = parentRef.current.scrollHeight;
			}
		}
	}, [virtualizer, messages.length]);

	// 检查是否在底部附近 - 基于虚拟滚动的逻辑
	const isNearBottom = useCallback(() => {
		if (!parentRef.current || messages.length === 0) return true;
		
		// 获取当前可见的虚拟项
		const virtualItems = virtualizer.getVirtualItems();
		if (virtualItems.length === 0) return true;
		
		// 检查最后一个可见项是否是最后的消息
		const lastVisibleIndex = virtualItems[virtualItems.length - 1]?.index ?? 0;
		const isLastMessageVisible = lastVisibleIndex >= messages.length - 1;
		
		// 或者检查滚动位置
		const scrollElement = parentRef.current;
		const { scrollTop, scrollHeight, clientHeight } = scrollElement;
		const threshold = 50; // Artifact 中使用更小的阈值
		const isScrollNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;
		
		return isLastMessageVisible || isScrollNearBottom;
	}, [virtualizer, messages.length]);

	// 检查用户是否手动滚动了
	const [isAtBottom, setIsAtBottom] = useState(true);
	
	useEffect(() => {
		const scrollElement = parentRef.current;
		if (!scrollElement) return;

		const handleScroll = () => {
			setIsAtBottom(isNearBottom());
		};

		scrollElement.addEventListener("scroll", handleScroll);
		return () => scrollElement.removeEventListener("scroll", handleScroll);
	}, [isNearBottom]);

	// 当有新消息或消息更新时自动滚动到底部
	useEffect(() => {
		if (messages.length > 0 && isAtBottom) {
			// 延迟滚动，确保 DOM 更新完成
			const timer = setTimeout(() => {
				scrollToBottom();
			}, 100);
			
			return () => clearTimeout(timer);
		}
	}, [messages.length, scrollToBottom, isAtBottom]);

	// 特别处理流式响应时的自动滚动
	useEffect(() => {
		if (status === "streaming" && messages.length > 0) {
			// 流式响应时，如果用户在底部，持续滚动到底部
			if (isAtBottom) {
				const timer = setTimeout(() => {
					scrollToBottom();
				}, 150);
				
				return () => clearTimeout(timer);
			}
		}
	}, [status, messages, scrollToBottom, isAtBottom]);

	// Form submission handler
	const handleFormSubmit = async (
		e: React.FormEvent<HTMLFormElement>,
		options?: { experimental_attachments?: FileList },
	) => {
		e.preventDefault();

		if (!input.trim() && !options?.experimental_attachments) return;

		// Prevent multiple submissions
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

	// Stop generation handler
	const handleStopGeneration = () => {
		stop();
		toast.info("Generation stopped");
	};

	return (
		<div className={cn("flex flex-col h-full bg-card", className)}>
			{/* Message list area */}
			{messages.length === 0 ? (
				<div className="flex-1 flex items-center justify-center min-h-0">
					<div className="text-center px-4">
						<p className="text-sm text-muted-foreground">
							Start a new conversation
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							Chat with AI here
						</p>
					</div>
				</div>
			) : (
				<div className="flex-1 relative min-h-0">
					<div
						ref={parentRef}
						className="h-full overflow-y-auto overflow-x-hidden px-2"
						style={{
							contain: 'strict',
						}}
					>
						<div
							style={{
								height: virtualizer.getTotalSize(),
								width: '100%',
								position: 'relative',
							}}
						>
							{virtualizer.getVirtualItems().map((virtualItem) => {
								const message = messages[virtualItem.index];
								if (!message) return null; // 安全检查
								
								const isLastMessage = virtualItem.index === messages.length - 1;

								return (
									<div
										key={virtualItem.key}
										data-index={virtualItem.index}
										ref={virtualizer.measureElement}
										style={{
											position: 'absolute',
											top: 0,
											left: 0,
											width: '100%',
											transform: `translateY(${virtualItem.start}px)`,
										}}
									>
										<div className="py-1">
											<ArtifactMessage
												message={message}
												isLoading={status === "streaming" && isLastMessage}
											/>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* 滚动到底部按钮 */}
					{!isAtBottom && (
						<div className="absolute bottom-4 right-4 z-10">
							<Button
								variant="outline"
								size="sm"
								onClick={scrollToBottom}
								className="rounded-full shadow-lg bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90"
							>
								<ChevronDown className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>
			)}

			{/* Chat input area */}
			<div className="flex-shrink-0 p-2">
				{/* Error display */}
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
				<ChatInput
					input={input}
					handleInputChange={handleInputChange}
					handleSubmit={handleFormSubmit}
					handleStopGeneration={handleStopGeneration}
					mcpEnabled={mcpEnabled}
					toggleMcpEnabled={toggleMcpEnabled}
					status={status}
					isUploading={isUploading}
					className="max-w-none"
				/>
			</div>
		</div>
	);
}