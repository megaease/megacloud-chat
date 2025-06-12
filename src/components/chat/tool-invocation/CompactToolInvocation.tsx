import { motion } from "framer-motion";
import {
	IconChevronDown,
	IconExternalLink,
	IconFileText,
	IconCode,
	IconTable,
	IconPhoto,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { ToolState, ToolStatus, ToolTheme } from "./types";

interface CompactToolInvocationProps {
	toolState: ToolState;
	status: ToolStatus;
	theme: ToolTheme;
	isExpanded: boolean;
	onToggleExpanded: () => void;
	onOpenArtifact?: () => void;
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

export function CompactToolInvocation({
	toolState,
	status,
	theme,
	isExpanded,
	onToggleExpanded,
	onOpenArtifact,
}: CompactToolInvocationProps) {
	const args = toolState.args as {
		title?: string;
		content?: string;
		kind?: string;
	};

	// 对于 document 工具，显示更简洁的卡片样式
	if (toolState.isDocumentTool && status === "success") {
		const IconComponent = getDocumentIcon(args.kind);
		const title = args.title || "未命名文档";

		return (
			<motion.div
				initial={{ opacity: 0, y: 4 }}
				animate={{ opacity: 1, y: 0 }}
				className="mb-3 rounded-lg border border-blue-200/60 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 overflow-hidden cursor-pointer hover:border-blue-300/80 dark:hover:border-blue-700/60 transition-colors"
				onClick={onOpenArtifact}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onOpenArtifact?.();
					}
				}}
				role="button"
				tabIndex={0}
				aria-label={`打开文档: ${title}`}
			>
				{/* 紧凑的文档头部 */}
				<div className="flex items-center gap-3 p-3 relative">
					<div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-500 text-white flex-shrink-0">
						<IconComponent size={16} />
					</div>
					<div className="flex-1 min-w-0">
						<div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
							{title}
						</div>
						<div className="text-xs text-gray-600 dark:text-gray-400">
							{toolState.toolName}
						</div>
					</div>
					{/* 右上角的小图标指示器 */}
					{onOpenArtifact && (
						<div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex-shrink-0">
							<IconExternalLink size={12} />
						</div>
					)}
				</div>
			</motion.div>
		);
	}

	// 对于普通工具调用，显示简洁的行样式
	return (
		<motion.div
			initial={{ opacity: 0, y: 4 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				"mb-3 rounded-lg border overflow-hidden",
				theme.borderColor,
				theme.backgroundColor,
			)}
		>
			{/* 紧凑的工具头部 */}
			<div
				className={cn(
					"flex items-center gap-3 p-3 cursor-pointer transition-colors",
					theme.hoverBackgroundColor,
				)}
				onClick={onToggleExpanded}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onToggleExpanded();
					}
				}}
				role="button"
				tabIndex={0}
			>
				{/* 工具图标 */}
				<div
					className={cn(
						"flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0 text-white text-xs font-bold",
						status === "success"
							? "bg-blue-500"
							: status === "error"
								? "bg-red-500"
								: status === "executing"
									? "bg-amber-500"
									: "bg-gray-500",
					)}
				>
					{toolState.toolName.charAt(0).toUpperCase()}
				</div>

				{/* 工具信息 */}
				<div className="flex-1 min-w-0">
					<div className="text-sm font-medium text-gray-900 dark:text-gray-100">
						{toolState.toolName}
					</div>
					<div className="text-xs text-gray-600 dark:text-gray-400">
						{status === "executing"
							? "执行中..."
							: status === "success"
								? "执行成功"
								: status === "error"
									? "执行失败"
									: "就绪"}
					</div>
				</div>

				{/* 状态指示器 */}
				<div className="flex items-center gap-2">
					{status === "executing" && (
						<div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
					)}
					{(status === "success" || status === "error") && (
						<IconChevronDown
							size={14}
							className={cn(
								"transition-transform text-gray-400",
								isExpanded && "rotate-180",
							)}
						/>
					)}
				</div>
			</div>

			{/* 可展开的内容区域（紧凑版本） */}
			{isExpanded && (status === "success" || status === "error") && (
				<motion.div
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: "auto", opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					className="border-t border-gray-200/50 dark:border-gray-700/50"
				>
					<div className="p-3 bg-gray-50/50 dark:bg-gray-900/20">
						{/* 错误信息 */}
						{toolState.hasError && toolState.errorMessage && (
							<div className="mb-3 p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800/40">
								<div className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">
									执行错误
								</div>
								<div className="text-xs text-red-700 dark:text-red-300 font-mono">
									{toolState.errorMessage}
								</div>
							</div>
						)}

						{/* 简化的参数显示 */}
						{Object.keys(toolState.args).length > 0 && (
							<div className="mb-3">
								<div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
									参数
								</div>
								<div className="text-xs bg-white dark:bg-gray-900/40 rounded border p-2 font-mono">
									{JSON.stringify(toolState.args, null, 2)}
								</div>
							</div>
						)}
					</div>
				</motion.div>
			)}
		</motion.div>
	);
}
