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
		if (!toolState.isDocumentTool || !toolState.isSuccessful) return;

		// Debug: Log the full tool invocation result
		console.log("Full toolInvocation.result:", part.toolInvocation.result);
		console.log("toolState.result:", toolState.result);

		// Get documentId from tool invocation result
		const toolResult = part.toolInvocation.result;

		// Try different ways to extract documentId
		let documentId: string | undefined;

		// Case 1: documentId is directly in result
		if (toolResult && "documentId" in toolResult) {
			documentId = (toolResult as Record<string, unknown>).documentId as string;
		}

		// Case 2: documentId is in result.content
		if (!documentId && toolResult?.content) {
			if (typeof toolResult.content === "string") {
				try {
					const parsed = JSON.parse(toolResult.content);
					if (parsed && typeof parsed === "object" && "documentId" in parsed) {
						documentId = parsed.documentId as string;
					}
				} catch {
					// content is not JSON
				}
			} else if (Array.isArray(toolResult.content)) {
				// Check if any content item has documentId
				for (const item of toolResult.content) {
					if (typeof item === "object" && item && "documentId" in item) {
						documentId = (item as Record<string, unknown>).documentId as string;
						break;
					}
				}
			} else if (
				typeof toolResult.content === "object" &&
				toolResult.content &&
				"documentId" in toolResult.content
			) {
				documentId = (toolResult.content as Record<string, unknown>)
					.documentId as string;
			}
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
