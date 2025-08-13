import { CodeBlock, CodeBlockCode } from "@/components/prompt-kit/code-block";
import { Markdown } from "@/components/prompt-kit/markdown";
import { useDocumentToolAction } from "@/hooks/useDocumentToolAction";
import { cn } from "@/lib/utils";
import type {
	ResultContent,
	ToolInvocationPart,
} from "@/types/tool-invocation";
import {
	IconChevronDown,
	IconCode,
	IconExternalLink,
	IconFileText,
	IconPhoto,
	IconTable,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import type { ToolState, ToolStatus, ToolTheme } from "./types";

interface CompactToolInvocationProps {
	toolState: ToolState;
	status: ToolStatus;
	theme: ToolTheme;
	isExpanded: boolean;
	onToggleExpanded: () => void;
	onOpenArtifact?: (
		documentId: string,
		boundingBox: { top: number; left: number; width: number; height: number },
	) => void;
	isCompact?: boolean; // 新增：是否为紧凑模式
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

// 渲染工具调用结果（使用 prompt-kit 组件统一风格）
const renderResult = (
	result:
		| Array<ResultContent | string>
		| string
		| Record<string, unknown>
		| null,
	isCompact = false,
) => {
	if (!result) return null;

	// 如果结果是数组
	if (Array.isArray(result)) {
		return result.map((item, index) => {
			const key = `result-${
				typeof item === "string"
					? item.slice(0, 20)
					: item.text?.slice(0, 20) || "item"
			}-${index}`;

			if (typeof item === "string") {
				return (
					<div
						key={key}
						className={cn(
							isCompact ? "max-h-20" : "max-h-32",
							"overflow-y-auto",
						)}
					>
						<CodeBlock>
							<CodeBlockCode code={item} language="text" theme="github-light" />
						</CodeBlock>
					</div>
				);
			}
			if (item.type === "text") {
				return (
					<div
						key={key}
						className={cn(
							isCompact ? "max-h-20" : "max-h-32",
							"overflow-y-auto",
						)}
					>
						<Markdown className="prose-sm">{item.text}</Markdown>
					</div>
				);
			}
			if (item.type === "code") {
				return (
					<div
						key={key}
						className={cn(
							isCompact ? "max-h-20" : "max-h-32",
							"overflow-y-auto",
						)}
					>
						<CodeBlock>
							<CodeBlockCode
								code={item.text}
								language="tsx"
								theme="github-light"
							/>
						</CodeBlock>
					</div>
				);
			}
			if (item.type === "markdown") {
				return (
					<div
						key={key}
						className={cn(
							isCompact ? "max-h-20" : "max-h-32",
							"overflow-y-auto",
						)}
					>
						<Markdown className="prose-sm">{item.text}</Markdown>
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
				className={cn(isCompact ? "max-h-20" : "max-h-32", "overflow-y-auto")}
			>
				<CodeBlock>
					<CodeBlockCode code={result} language="text" theme="github-light" />
				</CodeBlock>
			</div>
		);
	}

	// 如果结果是对象（AI SDK v5 工具返回的结构化数据），以 JSON 方式展示一个摘要
	if (typeof result === "object") {
		const json = JSON.stringify(result, null, 2);
		return (
			<div
				className={cn(isCompact ? "max-h-24" : "max-h-40", "overflow-y-auto")}
			>
				<CodeBlock>
					<CodeBlockCode code={json} language="json" theme="github-light" />
				</CodeBlock>
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
	part,
}: CompactToolInvocationProps) {
	const {
		handleDocumentClick,
		canOpenArtifact: canOpenDoc,
		extractDocumentInfo,
		shouldDisableVersionSwitch,
		isStreamingActive,
	} = useDocumentToolAction();

	const args = (toolState.args || {}) as {
		title?: string;
		content?: string;
		kind?: string;
		documentId?: string;
	};

	// 从工具结果中提取版本信息
	const documentInfo = extractDocumentInfo(part);
	const resultVersion = documentInfo?.version;

	// 检查是否可以打开 artifact
	const canOpenArtifact = canOpenDoc(part, args, status);

	// 检查是否应该禁用版本切换
	const isDisabled = shouldDisableVersionSwitch(part, args);

	// 直接检查是否正在流式输出
	const isStreaming = isStreamingActive();

	// 处理文档点击事件
	const handleOpenArtifact = () => {
		// 如果正在流式输出，直接阻止所有点击
		if (isStreaming) {
			return;
		}

		if (!canOpenArtifact || isDisabled) {
			return;
		}

		const boundingBox = {
			top: window.innerHeight / 2 - 100,
			left: window.innerWidth / 2 - 200,
			width: 400,
			height: 200,
		};

		handleDocumentClick(part, args, boundingBox);
	};

	// For document tools, display a more compact card style
	if (
		toolState.isDocumentTool &&
		(status === "success" || status === "executing")
	) {
		const IconComponent = getDocumentIcon(args.kind);

		// Determine if this is an update or create based on documentId
		const isUpdate = !!args.documentId;
		const executingTitle = isUpdate
			? "Updating Document..."
			: "Creating Document...";

		// 从工具结果中获取标题（如果可用）
		const getResultTitle = () => {
			if (part?.toolInvocation?.result) {
				const toolResult = part.toolInvocation.result;
				// 工具返回的结果格式：{ documentId, title, kind, language, success }
				if (typeof toolResult === "object" && "title" in toolResult) {
					return (toolResult as Record<string, unknown>).title as string;
				}
			}
			return null;
		};

		const resultTitle = getResultTitle();
		const actualTitle = args.title || resultTitle;

		// 简化显示逻辑：第一行始终显示标题，第二行始终显示工具名称
		const title =
			actualTitle || (isUpdate ? "Updating Document" : "Creating Document");
		const subtitle = toolState.toolName;

		return (
			<motion.div
				initial={{ opacity: 0, y: 4 }}
				animate={{ opacity: 1, y: 0 }}
				className={cn(
					"my-3 rounded-lg border overflow-hidden transition-colors",
					status === "executing"
						? "border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/80 to-orange-50/60 dark:from-amber-950/40 dark:to-orange-950/30"
						: "border-blue-200/60 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30",
					canOpenArtifact &&
						!isDisabled &&
						!isStreaming &&
						"cursor-pointer hover:border-blue-300/80 dark:hover:border-blue-700/60",
					(isDisabled || isStreaming) && "opacity-60 cursor-not-allowed",
				)}
				onClick={isDisabled || isStreaming ? undefined : handleOpenArtifact}
				onKeyDown={
					isDisabled || isStreaming
						? undefined
						: (e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									handleOpenArtifact();
								}
							}
				}
				aria-label={
					isStreaming
						? "Cannot open while AI is streaming"
						: isDisabled
							? "Cannot open while streaming other content"
							: canOpenArtifact
								? `Open document: ${title}`
								: undefined
				}
			>
				{/* Compact document header */}
				<div className="flex items-center gap-3 p-3 relative">
					<div
						className={cn(
							"flex items-center justify-center w-8 h-8 rounded-md text-white flex-shrink-0",
							status === "executing" ? "bg-amber-500" : "bg-blue-500",
						)}
					>
						{status === "executing" ? (
							<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
						) : (
							<IconComponent size={16} />
						)}
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
								{title}
							</div>
							{/* 简洁明显的版本号显示 */}
							{resultVersion && (
								<span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50 flex-shrink-0">
									v{resultVersion}
								</span>
							)}
						</div>
						<div
							className={cn(
								"text-xs mt-0.5",
								status === "executing"
									? "text-amber-600 dark:text-amber-400"
									: "text-gray-600 dark:text-gray-400",
							)}
						>
							{subtitle}
						</div>
					</div>
					{/* Small icon indicator in top right */}
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
				"my-2 rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden",
				isCompact && "my-1",
			)}
		>
			{/* Header */}
			<button
				className={cn(
					"flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors",
					isCompact && "gap-1.5 px-2 py-1.5",
				)}
				onClick={onToggleExpanded}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onToggleExpanded();
					}
				}}
				type="button"
			>
				{/* Status dot */}
				<div
					className={cn(
						"flex items-center justify-center rounded-full text-white flex-shrink-0",
						isCompact ? "w-4 h-4 text-[10px]" : "w-5 h-5 text-[11px]",
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

				{/* Tool name */}
				<div className="flex-1 min-w-0">
					<span
						className={cn(
							"font-medium truncate",
							isCompact ? "text-xs" : "text-sm",
						)}
					>
						{toolState.toolName}
					</span>
				</div>

				{/* Status badge */}
				<span
					className={cn(
						"inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
						status === "executing"
							? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40"
							: status === "success"
								? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/40"
								: status === "error"
									? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/40"
									: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-300 dark:border-gray-800/40",
					)}
				>
					{status === "executing"
						? "Running"
						: status === "success"
							? "Completed"
							: status === "error"
								? "Error"
								: "Info"}
				</span>

				{(status === "success" || status === "error") && (
					<IconChevronDown
						size={isCompact ? 10 : 12}
						className={cn(
							"ml-1 text-muted-foreground transition-transform",
							isExpanded && "rotate-180",
						)}
					/>
				)}
			</button>

			{/* Details */}
			{isExpanded && (status === "success" || status === "error") && (
				<motion.div
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: "auto", opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					className="border-t"
				>
					<div
						className={cn(isCompact ? "px-2 py-1.5" : "px-3 py-2", "space-y-2")}
					>
						{/* Error */}
						{toolState.hasError && toolState.errorMessage && (
							<div className="rounded-md border border-red-200 bg-red-50 p-2 text-red-700 dark:border-red-800/40 dark:bg-red-950/20 dark:text-red-300">
								<div className="text-xs font-medium mb-1">Error</div>
								<div className="text-xs font-mono whitespace-pre-wrap break-words">
									{toolState.errorMessage}
								</div>
							</div>
						)}

						{/* Output */}
						{toolState.result && status === "success" && (
							<div>
								<div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
									Output
								</div>
								<div className="rounded-md border bg-background px-2 py-1">
									{renderResult(toolState.result, isCompact)}
								</div>
							</div>
						)}

						{/* Input */}
						{Object.keys(toolState.args).length > 0 && (
							<div>
								<div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
									Input
								</div>
								<div
									className={cn(
										"rounded-md border bg-background text-xs font-mono",
										isCompact
											? "px-1.5 py-1 max-h-16 overflow-y-auto"
											: "px-2 py-1",
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
