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
import type { ToolInvocationPart } from "@/types/tool-invocation";

/**
 * DocumentToolInvocation - 专门用于文档工具的展示组件
 *
 * 特点：
 * 1. 美观的卡片式设计，突出文档创建/更新的重要性
 * 2. 实时显示工具执行状态（创建中、更新中、已完成）
 * 3. 显示文档类型、版本号等详细信息
 * 4. 支持点击打开 Artifact 进行实时预览
 * 5. 内容预览功能，让用户快速了解文档内容
 *
 * 状态管理：
 * - isCreating: 正在创建/更新文档时的流式状态
 * - success: 文档创建/更新完成，显示最终结果
 * - 自动检测创建 vs 更新操作（基于 args.documentId）
 */

interface DocumentToolInvocationProps {
	toolState: ToolState;
	status: ToolStatus;
	theme: ToolTheme;
	onOpenArtifact: () => void;
	isLoading?: boolean;
	part?: ToolInvocationPart; // 添加 part 参数以访问工具调用结果
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

const getCreationStatusText = (state: string, isUpdate: boolean) => {
	switch (state) {
		case "call":
			return isUpdate ? "Initializing update..." : "Initializing tool...";
		case "partial-call":
			return isUpdate ? "Preparing update..." : "Preparing document...";
		case "processing":
			return isUpdate ? "Updating document..." : "Creating document...";
		default:
			return isUpdate ? "Updating document..." : "Creating document...";
	}
};

export function DocumentToolInvocation({
	toolState,
	status,
	theme,
	onOpenArtifact,
	isLoading = false,
	part,
}: DocumentToolInvocationProps) {
	const args = (toolState.args || {}) as {
		title?: string;
		content?: string;
		kind?: string;
		documentId?: string;
	};

	const content = args.content || "";
	const kind = args.kind || "text";
	const IconComponent = getDocumentIcon(kind);
	const typeLabel = getDocumentTypeLabel(kind);

	// Determine if we're in a creating/updating state
	// 只基于 status 和 toolState.state 来判断，不依赖 isLoading
	const isCreating =
		status === "executing" ||
		toolState.state === "call" ||
		toolState.state === "partial-call";

	// 区分创建和更新操作 - 基于 documentId 而不是 toolName
	const isUpdateOperation = !!args.documentId;

	// 从工具结果中获取标题和版本信息（如果可用）
	const getResultInfo = () => {
		if (part?.toolInvocation?.result) {
			const toolResult = part.toolInvocation.result;
			// 工具返回的结果格式：{ documentId, title, kind, language, version, success }
			const info: { title?: string; version?: number } = {};

			if (typeof toolResult === "object") {
				if ("title" in toolResult) {
					info.title = (toolResult as Record<string, unknown>).title as string;
				}
				if ("version" in toolResult) {
					info.version = (toolResult as Record<string, unknown>)
						.version as number;
				}
			}

			return info;
		}
		return {};
	};

	const { title: resultTitle, version: resultVersion } = getResultInfo();
	const actualTitle = args.title || resultTitle;

	// 简化显示逻辑：第一行始终显示标题，第二行始终显示工具名称
	const title =
		actualTitle ||
		(isUpdateOperation ? "Updating Document" : "Creating Document");
	const subtitle = toolState.toolName;

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
						{/* 简洁明显的版本号显示 */}
						{resultVersion && (
							<span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50 flex-shrink-0">
								v{resultVersion}
							</span>
						)}
					</div>
					<p className="text-sm text-gray-600 dark:text-gray-400 truncate">
						{subtitle}
					</p>
				</div>

				{/* Action Button */}
				{(status === "success" || 
				  (isCreating && args.title) || 
				  (isUpdateOperation && args.documentId)) && (
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
									{isCreating
										? isUpdateOperation
											? "View Update"
											: "View Live"
										: "Open Document"}
								</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>
								{isCreating
									? isUpdateOperation
										? "Watch document being updated in real-time"
										: "Watch document being created in real-time"
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
							{isCreating
								? isUpdateOperation
									? "Updating Content"
									: "Generating Content"
								: "Content Preview"}
						</span>
					</div>
					<div className="bg-white/80 dark:bg-gray-900/40 rounded-lg p-4 border border-blue-200/40 dark:border-blue-800/30">
						{isCreating ? (
							<div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
								<IconLoader2 size={16} className="animate-spin" />
								<span className="text-sm">
									{isUpdateOperation
										? "Updating document content..."
										: "Generating document content..."}
								</span>
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
