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
import type { ResultContent } from "@/types/tool-invocation";

interface CompactToolInvocationProps {
	toolState: ToolState;
	status: ToolStatus;
	theme: ToolTheme;
	isExpanded: boolean;
	onToggleExpanded: () => void;
	onOpenArtifact?: () => void;
	isCompact?: boolean; // 新增：是否为紧凑模式
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

// 渲染工具调用结果
const renderResult = (
	result: Array<ResultContent | string> | string | null,
	isCompact = false,
) => {
	if (!result) return null;

	// 如果结果是数组
	if (Array.isArray(result)) {
		return result.map((item, index) => {
			const key = `result-${typeof item === "string" ? item.slice(0, 20) : item.text?.slice(0, 20) || "item"}-${index}`;

			if (typeof item === "string") {
				return (
					<div
						key={key}
						className={cn(
							"text-xs font-mono whitespace-pre-wrap break-words",
							isCompact
								? "max-h-20 overflow-y-auto"
								: "max-h-32 overflow-y-auto",
						)}
					>
						{item}
					</div>
				);
			}
			if (item.type === "text") {
				return (
					<div
						key={key}
						className={cn(
							"text-xs whitespace-pre-wrap break-words",
							isCompact
								? "max-h-20 overflow-y-auto"
								: "max-h-32 overflow-y-auto",
						)}
					>
						{item.text}
					</div>
				);
			}
			if (item.type === "code") {
				return (
					<div
						key={key}
						className={cn(
							"text-xs font-mono whitespace-pre-wrap break-words bg-gray-100 dark:bg-gray-800 rounded p-2",
							isCompact
								? "max-h-20 overflow-y-auto"
								: "max-h-32 overflow-y-auto",
						)}
					>
						{item.text}
					</div>
				);
			}
			if (item.type === "markdown") {
				return (
					<div
						key={key}
						className={cn(
							"text-xs whitespace-pre-wrap break-words",
							isCompact
								? "max-h-20 overflow-y-auto"
								: "max-h-32 overflow-y-auto",
						)}
					>
						{item.text}
					</div>
				);
			}
			return null;
		});
	}

	// 如果结果是字符串
	if (typeof result === "string") {
		return (
			<div
				className={cn(
					"text-xs font-mono whitespace-pre-wrap break-words",
					isCompact ? "max-h-20 overflow-y-auto" : "max-h-32 overflow-y-auto",
				)}
			>
				{result}
			</div>
		);
	}

	return null;
};

export function CompactToolInvocation({
	toolState,
	status,
	theme,
	isExpanded,
	onToggleExpanded,
	onOpenArtifact,
	isCompact = false,
}: CompactToolInvocationProps) {
	const args = toolState.args as {
		title?: string;
		content?: string;
		kind?: string;
	};

	// For document tools, display a more compact card style
	if (toolState.isDocumentTool && status === "success") {
		const IconComponent = getDocumentIcon(args.kind);
		const title = args.title || "Untitled Document";

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
				aria-label={`Open document: ${title}`}
			>
				{/* Compact document header */}
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
					{/* Small icon indicator in top right */}
					{onOpenArtifact && (
						<div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex-shrink-0">
							<IconExternalLink size={12} />
						</div>
					)}
				</div>
			</motion.div>
		);
	}

	// For regular tool invocations, display a concise row style
	return (
		<motion.div
			initial={{ opacity: 0, y: 4 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				"rounded-md border overflow-hidden",
				isCompact ? "mb-1" : "mb-2",
				theme.borderColor,
				theme.backgroundColor,
			)}
		>
			{/* Compact tool header */}
			<div
				className={cn(
					"flex items-center cursor-pointer transition-colors",
					isCompact ? "gap-1.5 px-2 py-1.5" : "gap-2 px-3 py-2",
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
				{/* Tool icon */}
				<div
					className={cn(
						"flex items-center justify-center rounded flex-shrink-0 text-white text-xs font-medium",
						isCompact ? "w-4 h-4" : "w-5 h-5",
						status === "success"
							? "bg-blue-500"
							: status === "error"
								? "bg-red-500"
								: status === "executing"
									? "bg-amber-500"
									: "bg-gray-500",
					)}
				>
					{status === "success"
						? "✓"
						: status === "error"
							? "✗"
							: status === "executing"
								? "⋯"
								: "⋅"}
				</div>

				{/* Tool name and status */}
				<div className="flex-1 min-w-0 flex items-center justify-between">
					<div className="flex-1 min-w-0 flex items-center">
						<span
							className={cn(
								"font-medium text-gray-900 dark:text-gray-100 truncate",
								isCompact ? "text-xs" : "text-sm",
							)}
						>
							{toolState.toolName}
						</span>
						<span
							className={cn(
								"text-gray-400 flex-shrink-0",
								isCompact ? "mx-1" : "mx-2",
							)}
						>
							→
						</span>
					</div>
					<span
						className={cn(
							"flex-shrink-0",
							isCompact ? "text-xs" : "text-sm",
							status === "executing"
								? "text-amber-600 dark:text-amber-400"
								: status === "success"
									? "text-blue-600 dark:text-blue-400"
									: status === "error"
										? "text-red-600 dark:text-red-400"
										: "text-gray-600 dark:text-gray-400",
						)}
					>
						{status === "executing"
							? "Completed"
							: status === "success"
								? "Completed"
								: status === "error"
									? "Failed"
									: "Completed"}
					</span>
				</div>

				{/* Status indicator */}
				<div className="flex items-center gap-2">
					{status === "executing" && (
						<div
							className={cn(
								"rounded-full bg-amber-500 animate-pulse",
								isCompact ? "w-1.5 h-1.5" : "w-2 h-2",
							)}
						/>
					)}
					{(status === "success" || status === "error") && (
						<IconChevronDown
							size={isCompact ? 10 : 12}
							className={cn(
								"transition-transform text-gray-400",
								isExpanded && "rotate-180",
							)}
						/>
					)}
				</div>
			</div>

			{/* Expandable content area (compact version) */}
			{isExpanded && (status === "success" || status === "error") && (
				<motion.div
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: "auto", opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					className="border-t border-gray-200/50 dark:border-gray-700/50"
				>
					<div
						className={cn(
							"bg-gray-50/30 dark:bg-gray-900/10",
							isCompact ? "px-2 py-1.5" : "px-3 py-2",
						)}
					>
						{/* Error message */}
						{toolState.hasError && toolState.errorMessage && (
							<div
								className={cn(
									"bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800/40",
									isCompact ? "mb-1.5 p-1.5" : "mb-2 p-2",
								)}
							>
								<div className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">
									Error
								</div>
								<div className="text-xs text-red-700 dark:text-red-300 font-mono">
									{toolState.errorMessage}
								</div>
							</div>
						)}

						{/* Result display */}
						{toolState.result && status === "success" && (
							<div className={cn(isCompact ? "mb-1.5" : "mb-2")}>
								<div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
									Result
								</div>
								<div className="bg-white dark:bg-gray-900/40 rounded border px-2 py-1 text-gray-600 dark:text-gray-400">
									{renderResult(toolState.result, isCompact)}
								</div>
							</div>
						)}

						{/* Simplified parameter display */}
						{Object.keys(toolState.args).length > 0 && (
							<div>
								<div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
									Parameters
								</div>
								<div
									className={cn(
										"bg-white dark:bg-gray-900/40 rounded border font-mono text-gray-600 dark:text-gray-400",
										isCompact
											? "px-1.5 py-1 text-xs max-h-16 overflow-y-auto"
											: "px-2 py-1 text-xs",
									)}
								>
									{JSON.stringify(toolState.args, null, isCompact ? 1 : 2)}
								</div>
							</div>
						)}
					</div>
				</motion.div>
			)}
		</motion.div>
	);
}
