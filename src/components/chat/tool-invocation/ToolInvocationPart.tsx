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
	const handleOpenArtifact = async () => {
		if (!toolState.isDocumentTool) return;

		// For creating documents, we can open them even before completion
		// For completed documents, we need a result with documentId
		const isCreating =
			status === "executing" ||
			toolState.state === "call" ||
			toolState.state === "partial-call";

		let documentId: string | undefined;

		if (isCreating) {
			// For creating documents, try to get documentId from args or generate a temp one
			const args = toolState.args as {
				title?: string;
				content?: string;
				kind?: string;
			};
			// We'll use streaming mode - the DataStreamHandler will provide the real documentId
			setArtifact({
				documentId: `temp_${Date.now()}`, // Temporary ID, will be updated by DataStreamHandler
				title: args.title || "Creating Document...",
				kind: (args.kind as "text" | "code" | "sheet" | "image") || "text",
				content: "", // Start with empty content, will be populated by streaming
				isVisible: true,
				status: "streaming", // Use streaming status
				boundingBox: {
					top: window.innerHeight / 2 - 100,
					left: window.innerWidth / 2 - 200,
					width: 400,
					height: 200,
				},
				dataSource: "stream", // Use stream mode to show live updates
				isStreaming: true,
			});
			return;
		}

		// For completed documents, use the existing logic
		if (!toolState.isSuccessful) return;

		// Debug: Log the full tool invocation result
		console.log("Full toolInvocation.result:", part.toolInvocation.result);
		console.log("toolState.result:", toolState.result);

		// Get documentId from tool invocation result
		const toolResult = part.toolInvocation.result;

		// Try different ways to extract documentId
		// Case 1: documentId is directly in result
		if (toolResult && "id" in toolResult) {
			documentId = (toolResult as Record<string, unknown>).id as string;
		}

		console.log("Extracted documentId:", documentId);

		if (!documentId) {
			console.error("No documentId found in tool result:", toolResult);
			return;
		}

		// Create a mock bounding box (from screen center)
		const boundingBox = {
			top: window.innerHeight / 2 - 100,
			left: window.innerWidth / 2 - 200,
			width: 400,
			height: 200,
		};

		// Only set documentId and UI state, ArtifactContent will handle data fetching automatically
		setArtifact({
			documentId: documentId,
			title: "Loading...", // Placeholder title will be replaced by ArtifactContent
			kind: "text", // Placeholder kind will be replaced by ArtifactContent
			content: "", // Empty content triggers database mode in ArtifactContent
			isVisible: true,
			status: "idle",
			boundingBox,
			dataSource: "database", // Use 'database' to indicate fetching from database
			isStreaming: false, // Not streaming since we are fetching from database
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

	// 如果是 document 工具，使用特殊的文档样式（无论是否成功）
	if (toolState.isDocumentTool) {
		return (
			<DocumentToolInvocation
				toolState={toolState}
				status={status}
				theme={theme}
				onOpenArtifact={handleOpenArtifact}
				isLoading={isLoading || status === "executing"}
			/>
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
