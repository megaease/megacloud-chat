"use client";

import { useState } from "react";
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
	FileType,
	Image as ImageIcon,
	FileText,
	ZoomIn,
	XCircle,
	Download,
} from "lucide-react";
import { Markdown } from "../markdown";
import { CopyButton } from "../copy-button";
import type {
	MessagePart,
	ToolInvocationPart as ToolInvocationPartType,
	ResultContent,
	FilePart,
	UIMessage,
	ReasoningPart as ReasoningPartType,
} from "@/types/tool-invocation";
import { ChatItem } from "./chat-item";
import { ReasoningPart } from "./reasoning-part";
import { ToolInvocationPart } from "./tool-invocation-part";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";

interface ChatMessageProps {
	message: Message | UIMessage;
}

// Render different types of message parts
function renderMessagePart(
	part: MessagePart,
	key: string | number,
	isLastPart = true,
) {
	// If it's a string or no type specified
	if (!part || typeof part === "string") {
		return <Markdown key={key} content={part} />;
	}

	// Handle different part types
	switch (part.type) {
		case "step-start":
			return (
				<div key={key} className="text-muted-foreground text-xs italic">
					{
						// If it's the last part, show a loading spinner
						isLastPart ? (
							<div className="flex items-center gap-1">
								<Loader2 className="animate-spin" size={16} />
								<span>Step started...</span>
							</div>
						) : null
					}
				</div>
			);
		case "text":
			return <Markdown key={key} content={part.text} />;

		case "tool-invocation":
			return (
				<ToolInvocationPart key={key} part={part} isLastPart={isLastPart} />
			);
		case "reasoning":
			return <ReasoningPart key={key} part={part} isLastPart={isLastPart} />;
		// case "file":
		// 	return (
		// 		<div key={key} className="my-2">
		// 			<div className="flex items-center gap-2 p-3 rounded-md bg-muted/40">
		// 				<File size={20} className="text-primary" />
		// 				<div className="flex-1 truncate">
		// 					{part.name && <p className="font-medium text-sm">{part.name}</p>}
		// 					<p className="text-xs text-muted-foreground truncate">
		// 						{part.content.length} characters
		// 					</p>
		// 				</div>
		// 				<CopyButton text={part.content} />
		// 			</div>
		// 		</div>
		// 	);
		case "image":
			return (
				<div key={key} className="my-2">
					<div className="relative border rounded-md overflow-hidden">
						<img
							src={part.src}
							alt={part.alt || "Image"}
							className="object-cover object-center overflow-hidden rounded-md h-full max-h-96 max-w-64 w-fit transition-opacity duration-300 opacity-100"
						/>
					</div>
				</div>
			);
		case "pdf":
			return (
				<div key={key} className="my-2">
					<div className="border rounded-md overflow-hidden">
						<iframe
							src={part.src}
							className="overflow-hidden rounded-md h-full max-h-96 max-w-64 w-fit transition-opacity duration-300 opacity-100"
							title="PDF Document"
						/>
					</div>
				</div>
			);
		case "text-file":
			return (
				<div key={key} className="my-2">
					<div className="flex items-center gap-2 p-3 rounded-md bg-muted/40 mb-2">
						<FileText size={20} className="text-primary" />
						<div className="flex-1 truncate">
							{part.name && <p className="font-medium text-sm">{part.name}</p>}
						</div>
						<CopyButton text={part.content} />
					</div>
					<pre className="bg-muted/40 p-4 rounded-md overflow-x-auto">
						<code>{part.content}</code>
					</pre>
				</div>
			);
		default:
			return null;
	}
}

export function ChatMessage({ message }: ChatMessageProps) {
	const isUser = message.role === "user";
	const [previewAttachment, setPreviewAttachment] = useState<{
		url: string;
		type: string;
		name?: string;
	} | null>(null);

	// Handle message content display
	const renderContent = () => {
		// If message has parts array
		if (message.parts && Array.isArray(message.parts)) {
			// Filter out parts that would render as null (like step-start)
			const validParts = message.parts.map((part, index) => {
				const convertedPart = part as MessagePart;
				const isLastPart = index === (message?.parts?.length ?? 0) - 1;
				return renderMessagePart(
					convertedPart,
					`message-part-${index}`,
					isLastPart,
				);
			});

			return validParts.length > 0 ? validParts : null;
		}

		// If only has regular content
		return <Markdown content={message.content as string} />;
	};

	// Render attachments if present
	const renderAttachments = () => {
		if (
			!message.experimental_attachments ||
			message.experimental_attachments.length === 0
		) {
			return null;
		}

		return (
			<div className="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2">
				{message.experimental_attachments.map((attachment) => {
					const uniqueKey = `${message.id}-${attachment.name || ""}-${attachment.url}`;

					if (attachment.contentType?.startsWith("image/")) {
						return (
							<div
								key={uniqueKey}
								className="border rounded-md overflow-hidden group relative"
							>
								<div className="relative w-full h-full">
									<img
										src={attachment.url}
										alt={attachment.name || "Image attachment"}
										className="object-cover object-center overflow-hidden rounded-lg h-full max-h-96 max-w-64 w-fit transition-opacity duration-300 opacity-100"
									/>
									<div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
										<Button
											variant="ghost"
											size="icon"
											className="bg-background/80 hover:bg-background rounded-full p-2 mr-2"
											onClick={() =>
												setPreviewAttachment({
													url: attachment.url,
													type: attachment.contentType || "image/*",
													name: attachment.name,
												})
											}
										>
											<ZoomIn className="h-4 w-4" />
										</Button>
										<a
											href={attachment.url}
											download={attachment.name}
											target="_blank"
											rel="noopener noreferrer"
											className="bg-background/80 hover:bg-background rounded-full p-2 inline-flex items-center justify-center"
											title={`下载${attachment.name || "图片"}`}
											aria-label={`下载${attachment.name || "图片"}`}
										>
											<Download className="h-4 w-4" />
										</a>
									</div>
								</div>
								{attachment.name && (
									<div className="p-2 text-xs text-center text-muted-foreground">
										{attachment.name}
									</div>
								)}
							</div>
						);
					}

					if (attachment.contentType?.startsWith("application/pdf")) {
						return (
							<div
								key={uniqueKey}
								className="border rounded-md overflow-hidden group relative"
							>
								<div className="relative">
									<iframe
										src={attachment.url}
										className="w-full h-[300px]"
										title={attachment.name || "PDF attachment"}
									/>
									<div className="absolute top-2 right-2 flex gap-2">
										<Button
											variant="ghost"
											size="icon"
											className="bg-background/80 hover:bg-background rounded-full p-2"
											onClick={() =>
												setPreviewAttachment({
													url: attachment.url,
													type: "application/pdf",
													name: attachment.name,
												})
											}
										>
											<ZoomIn className="h-4 w-4" />
										</Button>
										<a
											href={attachment.url}
											download={attachment.name}
											target="_blank"
											rel="noopener noreferrer"
											className="bg-background/80 hover:bg-background rounded-full p-2 inline-flex items-center justify-center"
											title={`下载${attachment.name || "PDF文档"}`}
											aria-label={`下载${attachment.name || "PDF文档"}`}
										>
											<Download className="h-4 w-4" />
										</a>
									</div>
								</div>
								{attachment.name && (
									<div className="p-2 text-xs text-center text-muted-foreground">
										{attachment.name}
									</div>
								)}
							</div>
						);
					}

					// For other file types show a file icon with name
					return (
						<div
							key={uniqueKey}
							className="flex items-center gap-2 p-3 rounded-md bg-muted/40"
						>
							<FileType size={20} className="text-primary" />
							<div className="flex-1 truncate">
								<p className="font-medium text-sm">
									{attachment.name || "File attachment"}
								</p>
								<p className="text-xs text-muted-foreground">
									{attachment.contentType}
								</p>
							</div>
							<a
								href={attachment.url}
								download={attachment.name}
								target="_blank"
								rel="noopener noreferrer"
								className="bg-muted/80 hover:bg-muted rounded-full p-2 inline-flex items-center justify-center"
								title={`下载${attachment.name || "文件"}`}
								aria-label={`下载${attachment.name || "文件"}`}
							>
								<Download className="h-4 w-4" />
							</a>
						</div>
					);
				})}
			</div>
		);
	};

	// Check if there's any actual content to render
	const content = renderContent();
	const hasContent = content !== null && content !== undefined;

	return hasContent ? (
		<>
			<ChatItem isUser={isUser}>
				{content}
				{renderAttachments()}
			</ChatItem>

			<Dialog
				open={!!previewAttachment}
				onOpenChange={(open) => !open && setPreviewAttachment(null)}
			>
				<DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-1">
					<div className="flex justify-between items-center p-2 border-b">
						<div className="text-sm font-medium truncate max-w-[80%]">
							{previewAttachment?.name || "文件预览"}
						</div>
						<div className="flex gap-2">
							<a
								href={previewAttachment?.url}
								download={previewAttachment?.name}
								target="_blank"
								rel="noopener noreferrer"
								className="hover:bg-muted rounded-full p-2 inline-flex items-center justify-center"
								title="下载文件"
								aria-label="下载文件"
							>
								<Download className="h-4 w-4" />
							</a>
							<DialogClose asChild>
								<Button
									variant="ghost"
									size="icon"
									className="rounded-full h-8 w-8"
								>
									<XCircle className="h-5 w-5" />
								</Button>
							</DialogClose>
						</div>
					</div>
					<div className="flex-1 overflow-auto p-1 min-h-0">
						{previewAttachment?.type?.startsWith("image/") ? (
							<div className="h-full w-full flex items-center justify-center">
								<img
									src={previewAttachment.url}
									alt={previewAttachment.name || "预览图片"}
									className="max-h-full max-w-full object-contain"
								/>
							</div>
						) : previewAttachment?.type === "application/pdf" ? (
							<iframe
								src={previewAttachment.url}
								title={previewAttachment.name || "PDF预览"}
								className="w-full h-full border-0"
							/>
						) : null}
					</div>
				</DialogContent>
			</Dialog>
		</>
	) : null;
}
