import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDocumentToolAction } from "@/hooks/useDocumentToolAction";
import { cn } from "@/lib/utils";
import type { ToolInvocationPart } from "@/types/tool-invocation";
import {
	IconCode,
	IconExternalLink,
	IconFileText,
	IconLoader2,
	IconPhoto,
	IconTable,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { ToolState, ToolStatus, ToolTheme } from "./types";

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
		case "text":
			return "Text Document";
		default:
			return "";
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
	isLoading = false,
	part,
}: DocumentToolInvocationProps) {
	const { handleDocumentClick, extractDocumentInfo } = useDocumentToolAction();
	const tArtifact = useTranslations("Artifact");

	const args = (toolState.args || {}) as {
		title?: string;
		content?: string;
		kind?: string;
		documentId?: string;
	};

	const content = args.content || "";
	const kind = args.kind || "";
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

	// 从工具结果中获取文档信息
	const documentInfo = extractDocumentInfo(part);
	const resultTitle = documentInfo?.title;
	const resultVersion = documentInfo?.version;

	const actualTitle = args.title || resultTitle;

	// 简化显示逻辑：第一行始终显示标题，第二行始终显示工具名称
	const title =
		actualTitle ||
		(isUpdateOperation ? "Updating Document" : "Creating Document");
	const subtitle = toolState.toolName;

	// Get content preview (first 100 characters)
	const contentPreview =
		content.length > 100 ? `${content.substring(0, 100)}...` : content;

	// 点击打开 Artifact
	const handleOpenArtifact = () => {
		const boundingBox = {
			top: window.innerHeight / 2 - 100,
			left: window.innerWidth / 2 - 200,
			width: 400,
			height: 200,
		};

		handleDocumentClick(part, args, boundingBox);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 8, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
			className={cn(
				"group relative rounded-xl border my-6 overflow-hidden transition-all duration-300",
				// 更突出的样式设计
				isCreating
					? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/60 dark:via-yellow-950/50 dark:to-orange-950/50 border-amber-300 dark:border-amber-700 shadow-amber-200/50 dark:shadow-amber-900/30"
					: "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/60 dark:via-green-950/50 dark:to-teal-950/50 border-emerald-300 dark:border-emerald-700 shadow-emerald-200/50 dark:shadow-emerald-900/30",
				// 增强的悬停效果
				"cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
				// 发光效果
				isCreating
					? "hover:shadow-amber-300/40 dark:hover:shadow-amber-800/40"
					: "hover:shadow-emerald-300/40 dark:hover:shadow-emerald-800/40",
				// 边框动画效果
				"relative before:absolute before:inset-0 before:rounded-xl before:border-2 before:border-transparent",
				isCreating
					? "before:bg-gradient-to-r before:from-amber-400 before:via-yellow-400 before:to-orange-400"
					: "before:bg-gradient-to-r before:from-emerald-400 before:via-green-400 before:to-teal-400",
				"before:opacity-0 hover:before:opacity-20 before:transition-opacity before:duration-300",
			)}
		>
			{/* 顶部装饰条 */}
			<div
				className={cn(
					"h-1 w-full",
					isCreating
						? "bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400"
						: "bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400",
				)}
			/>

			{/* Document Header */}
			<button
				className={cn(
					"flex items-center gap-4 p-5 backdrop-blur-sm w-full",
					isCreating
						? "bg-white/80 dark:bg-gray-900/60"
						: "bg-white/80 dark:bg-gray-900/60",
				)}
				type="button"
				onClick={handleOpenArtifact}
			>
				{/* Document Icon with enhanced styling */}
				<div
					className={cn(
						"flex items-center justify-center w-12 h-12 rounded-xl shadow-lg flex-shrink-0 relative",
						"transition-transform duration-200 group-hover:scale-110",
						isCreating
							? "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
							: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white",
						// 内部发光效果
						"before:absolute before:inset-0 before:rounded-xl before:shadow-inner",
						isCreating
							? "before:shadow-amber-300/50"
							: "before:shadow-emerald-300/50",
					)}
				>
					{isCreating ? (
						<IconLoader2 size={24} className="animate-spin" />
					) : (
						<IconComponent size={24} />
					)}

					{/* 状态指示器 */}
					<div
						className={cn(
							"absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
							isCreating ? "bg-amber-400 animate-pulse" : "bg-emerald-400",
						)}
					/>
				</div>

				{/* Document Info */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
							{title}
						</h3>
						{typeLabel ? (
							<span
								className={cn(
									"text-xs px-2 py-1 rounded-full font-medium min-w-fit",
									isCreating
										? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
										: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
								)}
							>
								{typeLabel}
							</span>
						) : null}
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
			</button>

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
										{tArtifact("clickOpenToViewFull")}
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
