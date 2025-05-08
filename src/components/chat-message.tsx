"use client";

import type { Message } from "ai";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Code,
	Terminal,
	Database,
	Clock,
	CheckCircle2,
	AlertCircle,
} from "lucide-react";

interface ChatMessageProps {
	message: Message;
}

// Render different types of message parts
function renderMessagePart(part: any, index: number | string) {
	// If it's a string or no type specified
	if (!part || typeof part === "string") {
		return (
			<p key={index} className="whitespace-pre-wrap">
				{part}
			</p>
		);
	}

	// Handle different part types
	switch (part.type) {
		case "text":
			return (
				<p key={index} className="whitespace-pre-wrap">
					{part.text}
				</p>
			);

		case "tool-invocation":
			return <ToolInvocationPart key={index} part={part} />;

		// case "step-start":
		// 	return <StepMarker key={index} />;

		default:
			return null;
	}
}

// Step marker component
function StepMarker() {
	return (
		<div className="flex items-center gap-2 text-muted-foreground my-2 text-xs">
			<Clock size={14} />
			<span>处理步骤</span>
			<div className="h-px flex-1 bg-border" />
		</div>
	);
}

// Tool invocation component with Accordion
function ToolInvocationPart({ part }: { part: any }) {
	const toolInvocation = part?.toolInvocation || {};
	const toolName = toolInvocation.toolName || "未知工具";
	const isDatabase =
		toolName.includes("sql") || toolName.includes("postgresql");
	const args = JSON.stringify(toolInvocation.args, null, 2);
	const result =
		toolInvocation.result?.content &&
		Array.isArray(toolInvocation.result.content)
			? toolInvocation.result.content
			: JSON.stringify(toolInvocation.result, null, 2);

	// Determine icon based on tool name
	const getToolIcon = (name: string) => {
		if (isDatabase) {
			return <Database size={16} className="text-primary" />;
		}
		return <Terminal size={16} className="text-primary" />;
	};

	// Determine status icon
	const getStatusIcon = () => {
		if (toolInvocation.state === "result") {
			return toolInvocation.result?.isError ? (
				<AlertCircle size={14} className="text-destructive" />
			) : (
				<CheckCircle2 size={14} className="text-green-500" />
			);
		}
		return <Clock size={14} className="text-muted-foreground" />;
	};

	return (
		<div className="border border-primary/30 bg-accent/30 rounded-[var(--radius)] my-3 shadow-[var(--shadow-xs)]">
			<Accordion type="single" collapsible>
				<AccordionItem value="item-0" className="border-0">
					<AccordionTrigger className="px-3 py-2 hover:no-underline">
						<div className="flex items-center gap-2 w-full">
							{getToolIcon(toolName)}
							<span className="font-medium text-primary">{toolName}</span>
							<div className="ml-auto flex items-center gap-1 text-xs">
								{getStatusIcon()}
								<span className="text-muted-foreground">
									{toolInvocation.state === "result" ? "完成" : "处理中"}
								</span>
							</div>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-3 pb-3 pt-0">
						{toolInvocation.state === "result" && (
							<div className="text-sm">
								<div className="bg-card rounded-[var(--radius)] overflow-hidden mb-3 border border-border">
									<div className="flex items-center justify-between px-3 py-1.5 bg-accent/50 border-b border-border">
										<div className="font-medium text-xs text-card-foreground">
											输入参数
										</div>
									</div>
									<div className="p-3">
										<pre className="whitespace-pre-wrap break-words text-xs">
											{args}
										</pre>
									</div>
								</div>

								<div className="bg-card rounded-[var(--radius)] overflow-hidden border border-border">
									<div className="flex items-center justify-between px-3 py-1.5 bg-accent/50 border-b border-border">
										<div className="font-medium text-xs text-card-foreground">
											结果
										</div>
									</div>

									{toolInvocation.result?.content &&
									Array.isArray(toolInvocation.result.content) ? (
										<div className="p-3 border-l-2 border-primary/30">
											{toolInvocation.result.content.map(
												(
													resultItem:
														| {
																type: string;
																content: string;
														  }
														| string,
													index: number,
												) => renderMessagePart(resultItem, `result-${index}`),
											)}
										</div>
									) : (
										<div className="p-3">
											<pre className="whitespace-pre-wrap break-words text-xs">
												{result}
											</pre>
										</div>
									)}
								</div>
							</div>
						)}
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}

export function ChatMessage({ message }: ChatMessageProps) {
	const isUser = message.role === "user";

	// Handle message content display
	const renderContent = () => {
		// If message has parts array
		if (message.parts && Array.isArray(message.parts)) {
			return message.parts.map((part, index) => renderMessagePart(part, index));
		}

		// If message has content property that's an array
		if (message.content && Array.isArray(message.content)) {
			return message.content.map((part, index) =>
				renderMessagePart(part, index),
			);
		}

		// If only has regular content
		return <p className="whitespace-pre-wrap">{message.content}</p>;
	};

	return (
		<div
			className={cn(
				"flex gap-4 text-sm py-4",
				isUser ? "flex-row-reverse" : "",
			)}
		>
			<Avatar
				className={cn("mt-0.5 h-8 w-8 flex-shrink-0 shadow-[var(--shadow-xs)]")}
			>
				<AvatarFallback
					className={cn(
						"rounded-[var(--radius)]",
						isUser
							? "bg-primary text-primary-foreground"
							: "bg-secondary text-secondary-foreground",
					)}
				>
					{isUser ? "U" : "AI"}
				</AvatarFallback>
			</Avatar>
			<div
				className={cn("flex-1 space-y-2", isUser ? "text-right" : "text-left")}
			>
				<div
					className={cn(
						"inline-block rounded-[var(--radius)] px-4 py-3 max-w-[90%]",
						isUser
							? "bg-primary text-primary-foreground shadow-[var(--shadow-xs)] w-auto"
							: "bg-card text-card-foreground border border-border shadow-[var(--shadow-xs)] w-full",
					)}
				>
					{renderContent()}
				</div>
			</div>
		</div>
	);
}
