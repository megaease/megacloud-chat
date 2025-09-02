import { useArtifact } from "@/context/artifact-provider-context";
import { useDocumentToolAction } from "@/hooks/useDocumentToolAction";
import { cn } from "@/lib/utils";
import type {
	ToolInvocationPart,
	ToolInvocationResult,
} from "@/types/tool-invocation";
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

// AI SDK 5 dynamic-tool type
type DynamicToolPart = {
	type: "dynamic-tool";
	toolName: string;
	toolCallId: string;
	state: string;
	input?: unknown;
	output?: unknown;
};

interface ModernDocumentToolProps {
	part: DynamicToolPart;
	isLoading?: boolean;
	compact?: boolean;
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
			return "Document";
	}
};

export function ModernDocumentTool({
	part,
	isLoading = false,
	compact = false,
}: ModernDocumentToolProps) {
	const { loadAndShowArtifact } = useArtifact();
	const { handleDocumentClick, canOpenArtifact, shouldDisableVersionSwitch } =
		useDocumentToolAction();
	const tArtifact = useTranslations("Artifact");

	// 解析输入参数
	const input = (part.input || {}) as {
		title?: string;
		content?: string;
		kind?: string;
		documentId?: string;
	};

	// 解析输出结果
	const output = (part.output || {}) as {
		documentId?: string;
		id?: string; // 添加对 id 字段的支持
		title?: string;
		kind?: string;
		version?: number;
		success?: boolean;
	};

	// 确定状态
	const isCreating = part.state !== "output-available";
	const isUpdateOperation = !!input.documentId;

	// 获取文档信息
	const title =
		input.title ||
		output.title ||
		(isUpdateOperation ? "Updating Document" : "Creating Document");
	const kind = input.kind || output.kind || "";
	const version = output.version;
	const documentId = output.documentId || output.id || input.documentId; // 支持多种 id 字段

	const IconComponent = getDocumentIcon(kind);
	const typeLabel = getDocumentTypeLabel(kind);

	// 内容预览
	const content = input.content || "";
	const contentPreview =
		content.length > 100 ? `${content.substring(0, 100)}...` : content;

	// 处理点击打开
	const handleOpenArtifact = () => {
		if (process.env.NODE_ENV !== "production") {
			console.log("ModernDocumentTool clicked", {
				documentId,
				version,
				output,
				part,
				input,
			});
		}

		// 直接使用 DynamicToolPart 格式，无需转换
		// 检查是否可以打开
		const canOpen = canOpenArtifact(
			part,
			input,
			part.state === "output-available" ? "success" : "input-streaming",
		);

		// 检查是否应该禁用
		const isDisabled = shouldDisableVersionSwitch(part, input);

		if (process.env.NODE_ENV !== "production") {
			console.log("ModernDocumentTool permission check", {
				canOpen,
				isDisabled,
				documentId,
				version,
			});
		}

		if (!canOpen || isDisabled) {
			if (process.env.NODE_ENV !== "production") {
				console.log("ModernDocumentTool click prevented", {
					canOpen,
					isDisabled,
					reason: !canOpen ? "Cannot open" : "Disabled",
				});
			}
			return;
		}

		// 使用统一的点击处理逻辑
		const boundingBox = {
			top: window.innerHeight / 2 - 200,
			left: window.innerWidth - 700,
			width: 680,
			height: 400,
		};

		handleDocumentClick(part, input, boundingBox);
	};

	// Compact mode rendering
	if (compact) {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.2 }}
				className={cn(
					"group relative rounded-lg border my-3 overflow-hidden transition-all duration-200 w-full",
					// 紧凑模式样式
					isCreating
						? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-amber-300/50 dark:border-amber-700/50"
						: "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-300/50 dark:border-emerald-700/50",
					"cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
				)}
				onClick={handleOpenArtifact}
			>
				{/* 顶部装饰条 */}
				<div
					className={cn(
						"h-0.5 w-full",
						isCreating
							? "bg-gradient-to-r from-amber-400 to-orange-400"
							: "bg-gradient-to-r from-emerald-400 to-teal-400",
					)}
				/>

				{/* 紧凑内容 */}
				<div className="flex items-center gap-3 p-3">
					{/* 小图标 */}
					<div
						className={cn(
							"flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0",
							isCreating
								? "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
								: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white",
						)}
					>
						{isCreating ? (
							<IconLoader2 size={16} className="animate-spin" />
						) : (
							<IconComponent size={16} />
						)}
					</div>

					{/* 文档信息 */}
					<div className="flex-1 min-w-0">
						<div className="flex flex-wrap items-center gap-2 mb-1">
							<h4
								className={cn(
									"font-semibold text-sm truncate whitespace-nowrap flex-1 min-w-0 max-w-[120px] sm:max-w-[150px] md:max-w-[180px]",
									isCreating
										? "text-amber-700 dark:text-amber-300"
										: "text-emerald-700 dark:text-emerald-300",
								)}
							>
								{title}
							</h4>
							{version && (
								<span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono flex-shrink-0">
									v{version}
								</span>
							)}
						</div>
						<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
							{isCreating
								? isUpdateOperation
									? "Updating..."
									: "Creating..."
								: "Document ready"}
						</p>
					</div>

					{/* 打开指示 */}
					<div className="flex-shrink-0">
						<IconExternalLink
							size={14}
							className={cn(
								"transition-transform duration-200 group-hover:scale-110",
								isCreating ? "text-amber-500" : "text-emerald-500",
							)}
						/>
					</div>
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 8, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
			className={cn(
				"group relative rounded-xl border my-6 overflow-hidden transition-all duration-300 w-full",
				// 更突出的样式设计
				isCreating
					? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/60 dark:via-yellow-950/50 dark:to-orange-950/50 border-amber-300 dark:border-amber-700 shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30"
					: "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/60 dark:via-green-950/50 dark:to-teal-950/50 border-emerald-300 dark:border-emerald-700 shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30",
				// 增强的悬停效果
				"cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
				// 发光效果
				isCreating
					? "hover:shadow-amber-300/40 dark:hover:shadow-amber-800/40"
					: "hover:shadow-emerald-300/40 dark:hover:shadow-emerald-800/40",
			)}
			onClick={handleOpenArtifact}
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
			<div className="flex items-center gap-4 p-6 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm">
				{/* Document Icon with enhanced styling */}
				<div
					className={cn(
						"flex items-center justify-center w-14 h-14 rounded-xl shadow-lg flex-shrink-0 relative",
						"transition-transform duration-200 group-hover:scale-110",
						isCreating
							? "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
							: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white",
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

				{/* Document Info with enhanced typography */}
				<div className="flex-1 min-w-0 overflow-hidden">
					<div className="flex flex-wrap items-center gap-3 mb-2 min-w-0">
						<h3
							className={cn(
								"font-bold text-xl text-gray-900 dark:text-gray-100 truncate whitespace-nowrap flex-1 min-w-0 max-w-[150px] sm:max-w-[200px] md:max-w-[250px]",
								// 添加渐变文字效果
								isCreating
									? "bg-gradient-to-r from-amber-700 to-orange-700 dark:from-amber-300 dark:to-orange-300 bg-clip-text text-transparent"
									: "bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent",
							)}
						>
							{title}
						</h3>

						{typeLabel && (
							<span
								className={cn(
									"text-xs px-3 py-1 rounded-full font-semibold shadow-sm flex-shrink-0",
									isCreating
										? "bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/60 dark:to-orange-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700"
										: "bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/60 dark:to-teal-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700",
								)}
							>
								{typeLabel}
							</span>
						)}

						{/* 版本标签 */}
						{version && (
							<span className="text-xs px-2 py-1 rounded-md font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex-shrink-0">
								v{version}
							</span>
						)}
					</div>

					<div className="space-y-2">
						{/* 状态文字 */}
						<p
							className={cn(
								"text-sm font-medium",
								isCreating
									? "text-amber-700 dark:text-amber-300"
									: "text-emerald-700 dark:text-emerald-300",
							)}
						>
							{isCreating
								? isUpdateOperation
									? "Updating document..."
									: "Creating document..."
								: "Document ready"}
						</p>

						{/* 工具名称 */}
						<p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
							{part.toolName}
						</p>

						{/* 内容预览 */}
						{contentPreview && (
							<p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
								{contentPreview}
							</p>
						)}
					</div>
				</div>

				{/* 右侧操作指示 */}
				<div className="flex flex-col items-center justify-center space-y-2 flex-shrink-0">
					<IconExternalLink
						size={20}
						className={cn(
							"transition-transform duration-200 group-hover:scale-110",
							isCreating ? "text-amber-500" : "text-emerald-500",
						)}
					/>
					<span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
						Open
					</span>
				</div>
			</div>

			{/* 底部进度条 (仅在创建时显示) */}
			{isCreating && (
				<div className="relative h-2 bg-gray-200 dark:bg-gray-700">
					<div className="h-full w-3/4 transition-all duration-1000 ease-out animate-pulse bg-gradient-to-r from-amber-400 to-orange-400" />
				</div>
			)}
		</motion.div>
	);
}
