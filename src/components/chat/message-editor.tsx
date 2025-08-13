"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { IconCheck, IconLoader2, IconX } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

interface MessageEditorProps {
	initialContent: string;
	onSave: (content: string) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
	className?: string;
}

export function MessageEditor({
	initialContent,
	onSave,
	onCancel,
	isLoading = false,
	className,
}: MessageEditorProps) {
	const t = useTranslations("Common");
	const [content, setContent] = useState(initialContent);
	const [hasChanges, setHasChanges] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Auto-focus and select all text when component mounts
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.focus();
			textareaRef.current.select();
		}
	}, []);

	// Track changes
	useEffect(() => {
		setHasChanges((content?.trim() || "") !== (initialContent?.trim() || ""));
	}, [content, initialContent]);

	const handleSave = async () => {
		if (!hasChanges || isLoading) return;

		const trimmedContent = content?.trim() || "";
		if (!trimmedContent) {
			// Don't allow empty messages
			return;
		}

		try {
			await onSave(trimmedContent);
		} catch (error) {
			console.error("Failed to save message:", error);
			// Error handling is done by the parent component
		}
	};

	const handleCancel = () => {
		if (isLoading) return;
		onCancel();
	};

	const handleContentChange = (
		event: React.ChangeEvent<HTMLTextAreaElement>,
	) => {
		setContent(event.target.value);
	};

	return (
		<div className={cn("space-y-3", className)}>
			{/* Editing indicator */}
			<div className="flex items-center gap-2 text-xs text-muted-foreground">
				<div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
				<span>{t("editingMessage")}</span>
			</div>

			{/* Text editor */}
			<div className="relative">
				<Textarea
					ref={textareaRef}
					value={content}
					onChange={handleContentChange}
					disabled={isLoading}
					placeholder={t("enterMessage")}
					className={cn(
						"min-h-[100px] resize-none border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-400",
						"transition-colors duration-200",
						isLoading && "opacity-50 cursor-not-allowed",
					)}
					rows={4}
				/>

				{/* Character count */}
				<div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
					{content.length}/10000
				</div>
			</div>

			{/* Action buttons */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button
						onClick={handleSave}
						disabled={!hasChanges || isLoading || !content?.trim()}
						size="sm"
						className="h-8 px-3 gap-1.5"
					>
						{isLoading ? (
							<IconLoader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							<IconCheck className="w-3.5 h-3.5" />
						)}
						{t("save")}
					</Button>

					<Button
						onClick={handleCancel}
						disabled={isLoading}
						variant="outline"
						size="sm"
						className="h-8 px-3 gap-1.5"
					>
						<IconX className="w-3.5 h-3.5" />
						{t("cancel")}
					</Button>
				</div>
			</div>

			{/* Validation message */}
			{!content?.trim() && hasChanges && (
				<div className="text-xs text-red-600 dark:text-red-400">
					{t("messageCannotBeEmpty")}
				</div>
			)}
		</div>
	);
}
