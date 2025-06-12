// components/artifact/ArtifactChatList.tsx
"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Message } from "ai";
import type { DBMessage } from "@/server/db/schema";
import type { UIMessage } from "@/types/tool-invocation";
import { ArtifactMessage } from "./ArtifactMessage";
import { Spinner } from "../spinner";

interface ArtifactChatListProps {
	chatId: string;
	className?: string;
	mode?: "history" | "live"; // 新增：历史模式或实时模式
}

// Hook to fetch chat messages (类似于 chat.tsx 中的 useChatMessages)
function useChatMessages(chatId: string) {
	return useQuery({
		queryKey: ["artifact-chat", "user-id", chatId],
		queryFn: async () => {
			const res = await fetch(`/api/chats/${chatId}`, {
				headers: {
					userId: "user-id",
				},
			});

			if (!res.ok) {
				if (res.status === 404) {
					return []; // 新聊天还不存在
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
		enabled: !!chatId,
		refetchOnWindowFocus: false,
		retry: (failureCount, error) => {
			if (error instanceof Error && error.message.includes("404")) {
				return false;
			}
			return failureCount < 3;
		},
	});
}

export function ArtifactChatList({
	chatId,
	className,
	mode = "history",
}: ArtifactChatListProps) {
	const scrollRef = useRef<HTMLDivElement>(null);

	const {
		data: messages = [],
		isLoading,
		isError,
		error,
	} = useChatMessages(chatId);

	// 自动滚动到底部
	useEffect(() => {
		if (scrollRef.current && messages.length > 0) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [messages]);

	if (isLoading) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<Spinner />
					<span className="text-sm text-muted-foreground">加载聊天记录...</span>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="text-center">
					<p className="text-sm text-destructive">加载失败</p>
					<p className="text-xs text-muted-foreground mt-1">
						{error instanceof Error ? error.message : "未知错误"}
					</p>
				</div>
			</div>
		);
	}

	if (messages.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="text-center">
					<p className="text-sm text-muted-foreground">暂无消息</p>
					<p className="text-xs text-muted-foreground mt-1">
						开始对话来查看消息历史
					</p>
				</div>
			</div>
		);
	}

	return (
		<div
			ref={scrollRef}
			className={`flex-1 overflow-y-auto ${className || ""}`}
		>
			<div className="space-y-0">
				{messages.map((message, index) => (
					<ArtifactMessage
						key={message.id}
						message={message}
						isLoading={false} // 在这个组件中我们不处理流式加载
					/>
				))}
			</div>
		</div>
	);
}
