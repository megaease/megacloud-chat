import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useArtifact } from "@/context/artifact-provider-context";
import { ToolExecutionStatus } from "./ToolExecutionStatus";
import { DocumentToolInvocation } from "./DocumentToolInvocation";
import { CompactToolInvocation } from "./CompactToolInvocation";
import { useToolInvocationState } from "./hooks";
import { TOOL_THEMES } from "./types";
import type { ToolInvocationProps } from "./types";

export function ToolInvocationPart({
	part,
	isLoading,
	isCompact = false,
}: ToolInvocationProps) {
	const { setArtifact } = useArtifact();
	const { toolState, status, isExpanded, toggleExpanded } =
		useToolInvocationState(part);

	const theme = TOOL_THEMES[status];

	// 确定内容是否会被显示
	const hasExpandableContent =
		(status === "success" || status === "error") && isExpanded;

	// Handle opening Artifact
	const handleOpenArtifact = () => {
		if (!toolState.isDocumentTool || !toolState.isSuccessful) return;

		const toolArgs = toolState.args as {
			title?: string;
			content?: string;
			kind?: string;
		};

		// Create a mock bounding box (from screen center)
		const boundingBox = {
			top: window.innerHeight / 2 - 100,
			left: window.innerWidth / 2 - 200,
			width: 400,
			height: 200,
		};
		setArtifact({
			documentId: `doc_${Date.now()}`,
			title: toolArgs.title || "Untitled Document",
			kind: (toolArgs.kind as "text" | "code" | "sheet" | "image") || "text",
			content: toolArgs.content || "",
			isVisible: true,
			status: "idle",
			boundingBox,
		});
	};

	// 如果是紧凑模式，使用专门的紧凑组件
	if (isCompact) {
		return (
			<CompactToolInvocation
				toolState={toolState}
				status={status}
				theme={theme}
				isExpanded={isExpanded}
				onToggleExpanded={toggleExpanded}
				onOpenArtifact={
					toolState.isDocumentTool ? handleOpenArtifact : undefined
				}
				isCompact={true}
			/>
		);
	}

	// 如果是 document 工具且成功执行，使用特殊的文档样式
	if (toolState.isDocumentTool && status === "success") {
		return (
			<DocumentToolInvocation
				toolState={toolState}
				status={status}
				theme={theme}
				onOpenArtifact={handleOpenArtifact}
			/>
		);
	}

	// 对于执行中的 document 工具，显示执行状态
	if (toolState.isDocumentTool && status === "executing") {
		return (
			<motion.div
				initial={{ opacity: 0, y: 8, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
				className={cn(
					"group relative rounded-lg border shadow-md my-6 overflow-hidden transition-all duration-300",
					"bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30",
					"border-blue-200/60 dark:border-blue-800/40",
				)}
			>
				<div className="p-5">
					<ToolExecutionStatus status={status} toolName={toolState.toolName} />
				</div>
			</motion.div>
		);
	}

	// 默认的工具调用样式（用于普通工具）- 使用简洁的单行风格
	return (
		<CompactToolInvocation
			toolState={toolState}
			status={status}
			theme={theme}
			isExpanded={isExpanded}
			onToggleExpanded={toggleExpanded}
			onOpenArtifact={toolState.isDocumentTool ? handleOpenArtifact : undefined}
			isCompact={false}
		/>
	);
}
