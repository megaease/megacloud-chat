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
	File,
	AudioWaveform,
	Loader2,
} from "lucide-react";
import { Markdown } from "./markdown";
import { CopyButton } from "./copy-button";
import type {
	MessagePart,
	ToolInvocationPart as ToolInvocationPartType,
	ResultContent,
	FilePart,
	UIMessage,
} from "@/types/tool-invocation";

interface ChatMessageProps {
	message: Message | UIMessage;
}

// Render different types of message parts
function renderMessagePart(part: MessagePart, key: string | number) {
	// If it's a string or no type specified
	if (!part || typeof part === "string") {
		return (
			<Markdown key={key} className="whitespace-pre-wrap my-0" content={part} />
		);
	}

	// Handle different part types
	switch (part.type) {
		case "text":
			return (
				<Markdown
					key={key}
					className="whitespace-pre-wrap my-0"
					content={part.text}
				/>
			);

		case "tool-invocation":
			return <ToolInvocationPart key={key} part={part} />;

		case "file":
			return (
				<div
					key={key}
					className="border rounded-[var(--radius)] p-3 bg-accent/30"
				>
					<div className="flex items-center gap-2 mb-2">
						<File size={14} className="text-primary" />
						<span className="text-xs font-medium">文件内容</span>
					</div>
					<pre className="whitespace-pre-wrap break-words text-xs">
						{part.content}
					</pre>
				</div>
			);

		case "step-start":
		case "reasoning":
		case "source":
			return null;

		default:
			return null;
	}
}

function renderResultContent(content: ResultContent | string, key: string) {
	// 尝试解析 JSON 字符串并格式化显示的通用函数
	const tryParseAndRenderJSON = (text: string, contentKey: string) => {
		try {
			// 尝试解析 JSON 字符串
			const parsed = JSON.parse(text);
			return (
				<div
					key={contentKey}
					className="relative rounded-[var(--radius)] border border-border overflow-hidden"
				>
					<pre className="whitespace-pre-wrap break-words text-xs p-2 max-h-[300px] overflow-auto m-0">
						{JSON.stringify(parsed, null, 2)}
					</pre>
				</div>
			);
		} catch {
			// 如果不是 JSON，返回 null 以使用后备渲染方式
			return null;
		}
	};

	if (typeof content === "string") {
		// 尝试解析为 JSON
		const jsonResult = tryParseAndRenderJSON(content, key);
		if (jsonResult) return jsonResult;

		// 不是 JSON，用 Markdown 渲染
		return (
			<Markdown
				key={key}
				className="whitespace-pre-wrap my-0"
				content={content}
			/>
		);
	}

	switch (content.type) {
		case "text":
		case "markdown":
			try {
				const parsed = JSON.parse(content.text);
				return (
					<div
						key={key}
						className="relative rounded-[var(--radius)] border border-border overflow-hidden"
					>
						<pre className="whitespace-pre-wrap break-words text-xs p-2 max-h-[300px] overflow-auto m-0">
							{JSON.stringify(parsed, null, 2)}
						</pre>
					</div>
				);
			} catch {
				return (
					<Markdown
						key={key}
						className="whitespace-pre-wrap my-0"
						content={content.text}
					/>
				);
			}
		case "code":
			return (
				<div
					key={key}
					className="relative rounded-[var(--radius)] border border-border overflow-hidden"
				>
					<div className="bg-muted/50 px-3 py-1 border-b border-border flex items-center justify-between">
						<span className="text-xs font-medium">Code</span>
						<CopyButton text={content.text} />
					</div>
					<pre className="whitespace-pre-wrap break-words text-xs p-2 m-0">
						<code className="font-mono">{content.text}</code>
					</pre>
				</div>
			);
		default:
			return null;
	}
}

function ToolInvocationPart({ part }: { part: ToolInvocationPartType }) {
	const { toolInvocation } = part;
	const toolName = toolInvocation.toolName;
	const isDatabase =
		toolName.includes("sql") || toolName.includes("postgresql");
	const args = JSON.stringify(toolInvocation.args, null, 2);

	const hasError = toolInvocation.result?.isError;
	const errorMessage = hasError
		? toolInvocation.result?.error || "未知错误"
		: null;

	// Determine icon based on tool name
	const getToolIcon = (name: string) => {
		if (isDatabase) {
			return <Database size={16} className="text-primary" />;
		}
		return <Terminal size={16} className="text-primary" />;
	};

	// Determine status icon
	const getStatusIcon = () => {
		const { state } = toolInvocation;

		if (state === "result") {
			return hasError ? (
				<AlertCircle size={14} className="text-destructive" />
			) : (
				<CheckCircle2 size={14} className="text-green-500" />
			);
		}

		// 处理加载中的状态
		if (state === "processing" || state === "partial-call") {
			return (
				<div className="animate-spin">
					<Clock size={14} className="text-primary" />
				</div>
			);
		}

		return <Clock size={14} className="text-muted-foreground" />;
	};

	// Render result content
	const renderResult = () => {
		const { result, state } = toolInvocation;

		// 处理加载状态
		if (state === "processing" || state === "partial-call") {
			return (
				<div className="flex items-center gap-2 text-muted-foreground">
					<div className="animate-spin h-4 w-4 rounded-full border-2 border-primary border-r-transparent" />
					<span className="text-xs">执行中...</span>
				</div>
			);
		}

		// 如果没有结果
		if (!result) {
			return (
				<div className="text-muted-foreground text-xs">等待执行结果...</div>
			);
		}

		// 如果没有 content，显示完整的结果对象
		if (!result.content) {
			return (
				<pre className="whitespace-pre-wrap break-words text-xs p-2 max-h-[300px] overflow-auto m-0">
					{JSON.stringify(result, null, 2)}
				</pre>
			);
		}

		if (typeof result.content === "string") {
			try {
				const parsed = JSON.parse(result.content);

				return (
					<div className="rounded-[var(--radius)] border border-border overflow-hidden">
						<pre className="whitespace-pre-wrap break-words text-xs p-2 max-h-[300px] overflow-auto m-0">
							{JSON.stringify(parsed, null, 2)}
						</pre>
					</div>
				);
			} catch {
				return (
					<Markdown
						content={result.content}
						className="text-xs max-h-[300px] overflow-auto my-0"
					/>
				);
			}
		}

		// 如果 content 是数组
		if (Array.isArray(result.content)) {
			if (result.content.length === 1) {
				const item = result.content[0];
				if (item) {
					const key = `${toolInvocation.toolName}-result-single-${typeof item === "string" ? "text" : item.type}`;
					return renderResultContent(item, key);
				}
			}

			return (
				<div className="rounded-[var(--radius)] border border-border overflow-hidden">
					<div className="bg-muted/50 px-3 py-1 border-b border-border">
						<span className="text-xs font-medium">
							结果列表 ({result.content.length})
						</span>
					</div>
					<div className="divide-y divide-border">
						{result.content.map((item, index) => {
							const key = `${toolInvocation.toolName}-result-${index}-${typeof item === "string" ? "text" : item.type}`;
							return (
								<div key={key} className="p-2">
									{renderResultContent(item, key)}
								</div>
							);
						})}
					</div>
				</div>
			);
		}

		return null;
	};

	return (
		<div
			className={cn(
				"border rounded-[var(--radius)] my-3 shadow-[var(--shadow-xs)]",
				hasError
					? "border-destructive/50 bg-destructive/10"
					: "border-primary/30 bg-accent/30",
			)}
		>
			<Accordion
				type="single"
				collapsible
				defaultValue={hasError ? "item-0" : undefined}
			>
				<AccordionItem value="item-0" className="border-0">
					<AccordionTrigger className="px-3 py-2 hover:no-underline">
						<div className="flex items-center gap-2 w-full">
							{getToolIcon(toolName)}
							<span
								className={cn(
									"font-medium",
									hasError ? "text-destructive" : "text-primary",
								)}
							>
								{toolName}
							</span>
							<div className="ml-auto flex items-center gap-1 text-xs">
								{getStatusIcon()}
								<span
									className={cn(
										hasError ? "text-destructive" : "text-muted-foreground",
									)}
								>
									{toolInvocation.state === "result"
										? hasError
											? "执行失败"
											: "已完成"
										: "处理中"}
								</span>
							</div>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-3 pb-3 pt-0">
						{toolInvocation.state === "result" && (
							<div className="text-sm">
								{hasError && (
									<div className="mb-3 p-3 rounded-[var(--radius)] bg-destructive/10 border border-destructive/30 text-destructive">
										<div className="flex items-center gap-2 mb-1">
											<AlertCircle size={14} />
											<span className="font-medium">错误信息</span>
										</div>
										<p className="text-xs whitespace-pre-wrap break-words">
											{errorMessage}
										</p>
									</div>
								)}

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

								<div
									className={cn(
										"bg-card rounded-[var(--radius)] overflow-hidden border",
										hasError ? "border-destructive/50" : "border-border",
									)}
								>
									<div
										className={cn(
											"flex items-center justify-between px-3 py-1.5 border-b",
											hasError
												? "bg-destructive/10 border-destructive/50"
												: "bg-accent/50 border-border",
										)}
									>
										<div
											className={cn(
												"font-medium text-xs",
												hasError ? "text-destructive" : "text-card-foreground",
											)}
										>
											执行结果
										</div>
									</div>
									<div className="p-3">{renderResult()}</div>
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
			return message.parts.map((part, index) => {
				const convertedPart = part as MessagePart;
				return renderMessagePart(convertedPart, `message-part-${index}`);
			});
		}

		// If only has regular content
		return (
			<Markdown
				content={message.content as string}
				className="whitespace-pre-wrap my-0"
			/>
		);
	};

	return (
		<div
			className={cn(
				"flex gap-4 text-sm py-4",
				isUser ? "flex-row-reverse pr-1" : "pl-1",
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
				className={cn(
					"flex-1 space-y-2",
					isUser ? "text-right" : "text-left",
					"max-w-[85%]", // 限制最大宽度
				)}
			>
				<div
					className={cn(
						"inline-block rounded-[var(--radius)] px-4 py-3 overflow-hidden text-left min-h-[1em]",
						isUser
							? "bg-primary text-primary-foreground shadow-[var(--shadow-xs)] w-auto"
							: "bg-card text-card-foreground border border-border shadow-[var(--shadow-xs)] w-full",
					)}
				>
					{renderContent()}
				</div>
				{/* {message.createdAt && (
					<div className="text-xs text-muted-foreground px-2 mt-2">
						{new Date(message.createdAt).toLocaleTimeString()}
					</div>
				)} */}
			</div>
		</div>
	);
}
