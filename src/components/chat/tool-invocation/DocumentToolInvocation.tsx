import { motion } from "framer-motion";
import {
	IconFileText,
	IconCode,
	IconTable,
	IconPhoto,
	IconExternalLink,
	IconLoader2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ToolState, ToolStatus, ToolTheme } from "./types";

interface DocumentToolInvocationProps {
	toolState: ToolState;
	status: ToolStatus;
	theme: ToolTheme;
	onOpenArtifact: () => void;
	isLoading?: boolean;
}

const getDocumentIcon = (kind?: string) => {
	switch (kind) {
		case "code":
			return IconCode;
		case "sheet":
			return IconTable;
		case "image":
			return IconPhoto;
		default:
			return IconFileText;
	}
};

const getDocumentTypeLabel = (kind?: string) => {
	switch (kind) {
		case "code":
			return "Code Document";
		case "sheet":
			return "Spreadsheet";
		case "image":
			return "Image";
		default:
			return "Text Document";
	}
};

const getCreationStatusText = (state: string) => {
	switch (state) {
		case "call":
			return "Initializing tool...";
		case "partial-call":
			return "Preparing document...";
		case "processing":
			return "Creating document...";
		default:
			return "Creating document...";
	}
};

export function DocumentToolInvocation({
	toolState,
	status,
	theme,
	onOpenArtifact,
	isLoading = false,
}: DocumentToolInvocationProps) {
	const args = (toolState.args || {}) as {
		title?: string;
		content?: string;
		kind?: string;
	};

	const content = args.content || "";
	const kind = args.kind || "text";
	const IconComponent = getDocumentIcon(kind);
	const typeLabel = getDocumentTypeLabel(kind);

	// Determine if we're in a creating state
	// 包含更多状态判断，确保能捕获到工具执行的各个阶段
	const isCreating =
		status === "executing" ||
		isLoading ||
		toolState.state === "call" ||
		toolState.state === "partial-call";

	const title =
		args.title || (isCreating ? "Creating Document..." : "Untitled Document");

	// Get content preview (first 100 characters)
	const contentPreview =
		content.length > 100 ? `${content.substring(0, 100)}...` : content;

	return (
		<motion.div
			initial={{ opacity: 0, y: 8, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
			className={cn(
				"group relative rounded-lg border my-6 overflow-hidden transition-all duration-300",
				isCreating
					? "bg-gradient-to-br from-amber-50/80 to-orange-50/60 dark:from-amber-950/40 dark:to-orange-950/30 border-amber-200/60 dark:border-amber-800/40 hover:shadow-amber-200/25 dark:hover:shadow-amber-900/25"
					: "bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 border-blue-200/60 dark:border-blue-800/40 hover:shadow-blue-200/25 dark:hover:shadow-blue-900/25",
				"hover:shadow-lg",
			)}
		>
			{/* Document Header */}
			<div
				className={cn(
					"flex items-center gap-4 p-5 backdrop-blur-sm border-b",
					isCreating
						? "bg-white/60 dark:bg-gray-900/40 border-amber-200/30 dark:border-amber-800/30"
						: "bg-white/60 dark:bg-gray-900/40 border-blue-200/30 dark:border-blue-800/30",
				)}
			>
				{/* Document Icon */}
				<div
					className={cn(
						"flex items-center justify-center w-10 h-10 rounded-lg shadow-lg flex-shrink-0",
						isCreating ? "bg-amber-500 text-white" : "bg-blue-500 text-white",
					)}
				>
					{isCreating ? (
						<IconLoader2 size={20} className="animate-spin" />
					) : (
						<IconComponent size={20} />
					)}
				</div>

				{/* Document Info */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
							{title}
						</h3>
						<span
							className={cn(
								"text-xs px-2 py-1 rounded-full font-medium",
								isCreating
									? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
									: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
							)}
						>
							{typeLabel}
						</span>
					</div>
					<p className="text-sm text-gray-600 dark:text-gray-400 truncate">
						{isCreating
							? getCreationStatusText(toolState.state)
							: `Created by ${toolState.toolName}`}
					</p>
				</div>

				{/* Action Button */}
				{(status === "success" || (isCreating && args.title)) && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								onClick={onOpenArtifact}
								size="sm"
								className={cn(
									"shadow-lg transition-all duration-200 hover:scale-105",
									isCreating
										? "bg-amber-500 hover:bg-amber-600 text-white"
										: "bg-blue-500 hover:bg-blue-600 text-white",
								)}
							>
								<IconExternalLink size={16} />
								<span className="ml-2">
									{isCreating ? "View Live" : "Open Document"}
								</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>
								{isCreating
									? "Watch document being created in real-time"
									: "Open document content"}
							</p>
						</TooltipContent>
					</Tooltip>
				)}
			</div>

			{/* Content Preview */}
			{(contentPreview || isCreating) && (
				<div className="p-5 bg-white/40 dark:bg-gray-900/20">
					<div className="mb-3">
						<span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
							<div
								className={cn(
									"w-2 h-2 rounded-full",
									isCreating ? "bg-amber-500 animate-pulse" : "bg-blue-500",
								)}
							/>
							{isCreating ? "Generating Content" : "Content Preview"}
						</span>
					</div>
					<div className="bg-white/80 dark:bg-gray-900/40 rounded-lg p-4 border border-blue-200/40 dark:border-blue-800/30">
						{isCreating ? (
							<div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
								<IconLoader2 size={16} className="animate-spin" />
								<span className="text-sm">Generating document content...</span>
							</div>
						) : (
							<>
								<pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words font-mono leading-relaxed overflow-hidden">
									{contentPreview}
								</pre>
								{content.length > 100 && (
									<div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
										Click "Open Document" to view full content...
									</div>
								)}
							</>
						)}
					</div>
				</div>
			)}
		</motion.div>
	);
}
