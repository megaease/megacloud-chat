// components/artifact/ArtifactMessage.tsx
"use client";

import { useState } from "react";
import type { Message } from "ai";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Markdown } from "../markdown";
import { Spinner } from "../spinner";
import type { MessagePart, UIMessage } from "@/types/tool-invocation";

interface ArtifactMessageProps {
	message: Message | UIMessage;
	isLoading?: boolean;
}

// 简化的消息部分渲染器，专为 Artifact 侧边栏设计
function renderSimpleMessagePart(part: MessagePart, key: string | number) {
	// 如果是字符串或没有指定类型
	if (!part || typeof part === "string") {
		return <Markdown key={key} content={part} className="text-sm" />;
	}

	// 处理不同的部分类型，但保持简洁
	switch (part.type) {
		case "text":
			return <Markdown key={key} content={part.text} className="text-sm" />;

		case "tool-invocation":
			// 对于工具调用，只显示工具名称和状态
			return (
				<div key={key} className="text-xs bg-muted/50 rounded px-2 py-1 my-1">
					<span className="font-medium">{part.toolInvocation.toolName}</span>
					{part.toolInvocation.state === "processing" && (
						<span className="text-muted-foreground ml-1">处理中...</span>
					)}
				</div>
			);

		case "reasoning":
			// 推理部分在侧边栏中简化显示
			return (
				<div
					key={key}
					className="text-xs bg-blue-50 dark:bg-blue-950/20 rounded px-2 py-1 my-1"
				>
					<span className="text-blue-700 dark:text-blue-300">💭 AI 思考中</span>
				</div>
			);

		case "image":
			return (
				<div key={key} className="my-2">
					<img
						src={part.src}
						alt={part.alt || "Image"}
						className="max-w-full h-auto max-h-32 rounded object-cover"
					/>
				</div>
			);

		case "text-file":
			return (
				<div key={key} className="text-xs bg-muted/50 rounded px-2 py-1 my-1">
					📄 {part.name || "文本文件"}
				</div>
			);

		default:
			return null;
	}
}

export function ArtifactMessage({
	message,
	isLoading = false,
}: ArtifactMessageProps) {
	const isUser = message.role === "user";

	// 处理消息内容显示
	const renderContent = () => {
		// 如果消息有 parts 数组
		if (message.parts && Array.isArray(message.parts)) {
			const validParts = message.parts
				.map((part, index) => {
					const convertedPart = part as MessagePart;
					return renderSimpleMessagePart(convertedPart, `part-${index}`);
				})
				.filter(Boolean);

			return validParts.length > 0 ? validParts : null;
		}

		// 如果只有常规内容
		return <Markdown content={message.content as string} className="text-sm" />;
	};

	// 渲染附件（简化版）
	const renderAttachments = () => {
		if (
			!message.experimental_attachments ||
			message.experimental_attachments.length === 0
		) {
			return null;
		}

		return (
			<div className="flex flex-wrap gap-1 mb-2">
				{message.experimental_attachments.map((attachment, index) => (
					<div
						key={`${attachment.url || attachment.name || "attachment"}-${index}`}
						className="flex items-center gap-1 px-2 py-1 bg-muted/40 rounded text-xs"
					>
						{attachment.contentType?.startsWith("image/") ? "🖼️" : "📎"}
						<span className="truncate max-w-20">
							{attachment.name || "附件"}
						</span>
					</div>
				))}
			</div>
		);
	};

	const content = renderContent();
	const hasContent = content !== null && content !== undefined;

	if (!hasContent) return null;

	return (
		<div
			className={cn(
				"flex gap-3 p-3 text-sm border-b border-border/50 last:border-b-0",
				isUser ? "flex-row-reverse" : "flex-row",
			)}
		>
			{/* 头像 */}
			<Avatar className="h-6 w-6 flex-shrink-0">
				<AvatarFallback
					className={cn(
						"text-xs rounded-md",
						isUser
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground",
					)}
				>
					{isUser ? "U" : "AI"}
				</AvatarFallback>
			</Avatar>

			{/* 消息内容 */}
			<div
				className={cn(
					"flex-1 min-w-0 space-y-1",
					isUser ? "text-right" : "text-left",
				)}
			>
				{/* 加载状态 */}
				{isLoading && !isUser && (
					<div className="flex items-center gap-2 mb-1">
						<Spinner variant="ellipsis" />
						<span className="text-xs text-muted-foreground">正在回复...</span>
					</div>
				)}

				{/* 附件 */}
				{renderAttachments()}

				{/* 消息内容 */}
				<div
					className={cn(
						"prose prose-sm max-w-none",
						isUser
							? "bg-primary/10 dark:bg-primary/20 rounded-lg px-3 py-2 inline-block"
							: "bg-transparent",
					)}
				>
					{content}
				</div>

				{/* 时间戳（可选） */}
				{message.createdAt && (
					<div className="text-xs text-muted-foreground mt-1">
						{new Date(message.createdAt).toLocaleTimeString()}
					</div>
				)}
			</div>
		</div>
	);
}
