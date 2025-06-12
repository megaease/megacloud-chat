import { motion } from "framer-motion";
import {
	IconFileText,
	IconCode,
	IconTable,
	IconPhoto,
	IconExternalLink,
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
			return "代码文档";
		case "sheet":
			return "电子表格";
		case "image":
			return "图片";
		default:
			return "文本文档";
	}
};

export function DocumentToolInvocation({
	toolState,
	status,
	theme,
	onOpenArtifact,
}: DocumentToolInvocationProps) {
	const args = toolState.args as {
		title?: string;
		content?: string;
		kind?: string;
	};

	const title = args.title || "未命名文档";
	const content = args.content || "";
	const kind = args.kind || "text";
	const IconComponent = getDocumentIcon(kind);
	const typeLabel = getDocumentTypeLabel(kind);

	// 获取内容预览（前 100 个字符）
	const contentPreview =
		content.length > 100 ? `${content.substring(0, 100)}...` : content;

	return (
		<motion.div
			initial={{ opacity: 0, y: 8, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
			className={cn(
				"group relative rounded-lg border my-6 overflow-hidden transition-all duration-300 hover:shadow-lg",
				"bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30",
				"border-blue-200/60 dark:border-blue-800/40",
				"hover:shadow-blue-200/25 dark:hover:shadow-blue-900/25",
			)}
		>
			{/* Document Header */}
			<div className="flex items-center gap-4 p-5 bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm border-b border-blue-200/30 dark:border-blue-800/30">
				{/* Document Icon */}
				<div
					className={cn(
						"flex items-center justify-center w-10 h-10 rounded-lg shadow-lg flex-shrink-0",
						"bg-blue-500 text-white",
					)}
				>
					<IconComponent size={20} />
				</div>

				{/* Document Info */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
							{title}
						</h3>
						<span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
							{typeLabel}
						</span>
					</div>
					<p className="text-sm text-gray-600 dark:text-gray-400 truncate">
						由 {toolState.toolName} 创建
					</p>
				</div>

				{/* Action Button */}
				{status === "success" && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								onClick={onOpenArtifact}
								size="sm"
								className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-all duration-200 hover:scale-105"
							>
								<IconExternalLink size={16} />
								<span className="ml-2">打开文档</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>在侧边栏中打开文档</p>
						</TooltipContent>
					</Tooltip>
				)}
			</div>

			{/* Content Preview */}
			{contentPreview && (
				<div className="p-5 bg-white/40 dark:bg-gray-900/20">
					<div className="mb-3">
						<span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
							<div className="w-2 h-2 rounded-full bg-blue-500" />
							内容预览
						</span>
					</div>
					<div className="bg-white/80 dark:bg-gray-900/40 rounded-lg p-4 border border-blue-200/40 dark:border-blue-800/30">
						<pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words font-mono leading-relaxed overflow-hidden">
							{contentPreview}
						</pre>
						{content.length > 100 && (
							<div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
								点击"打开文档"查看完整内容...
							</div>
						)}
					</div>
				</div>
			)}
		</motion.div>
	);
}
