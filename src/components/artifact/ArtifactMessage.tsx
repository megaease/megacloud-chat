// components/artifact/ArtifactMessage.tsx
"use client";

import { ChatMessage } from "@/components/chat/chat-message";
import type { Message } from "ai";
import type { UIMessage } from "@/types/tool-invocation";

interface ArtifactMessageProps {
	message: Message | UIMessage;
	isLoading?: boolean;
}

/**
 * ArtifactMessage 组件直接复用 ChatMessage 组件
 * 确保在 Artifact 侧边栏中的消息显示与主聊天区域保持一致
 * 使用紧凑模式适配 400px 宽度的侧边栏
 */
export function ArtifactMessage({
	message,
	isLoading = false,
}: ArtifactMessageProps) {
	return (
		<div className="min-w-0 overflow-hidden p-1 bg-card">
			{/* 使用 ChatMessage 组件来渲染消息 */}
			<ChatMessage message={message} isLoading={isLoading} isCompact={true} />
		</div>
	);
}
