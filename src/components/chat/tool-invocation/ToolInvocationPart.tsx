import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useArtifact } from "@/context/artifact-provider-context";
import { ToolExecutionStatus } from "./ToolExecutionStatus";
import { DocumentToolInvocation } from "./DocumentToolInvocation";
import { CompactToolInvocation } from "./CompactToolInvocation";
import { useToolInvocationState } from "./hooks";
import { TOOL_THEMES } from "./types";
import type { ToolInvocationProps } from "./types";

/**
 * ToolInvocationPart - 工具调用部分的核心组件
 *
 * 主要功能：
 * 1. 统一处理所有类型的工具调用展示（文档工具、普通工具）
 * 2. 管理工具调用状态（执行中、成功、失败）
 * 3. 处理 Artifact 的打开和版本切换
 * 4. 支持紧凑模式和完整模式的展示
 *
 * 工具调用状态流程：
 * - executing: 工具正在执行中，显示加载状态
 * - success: 工具执行成功，显示结果和打开按钮
 * - error: 工具执行失败，显示错误信息
 *
 * Artifact 管理：
 * - 流式创建：在工具执行过程中实时显示内容
 * - 版本切换：点击已完成的工具调用可以切换到对应版本
 * - 统一通过 artifact context 管理所有状态
 */

export function ToolInvocationPart({
	part,
	isLoading,
	isCompact = false,
}: ToolInvocationProps) {
	const { setArtifact, loadAndShowArtifact } = useArtifact();
	const { toolState, status, isExpanded, toggleExpanded } =
		useToolInvocationState(part);

	const theme = TOOL_THEMES[status];

	// 确定内容是否会被显示
	const hasExpandableContent =
		(status === "success" || status === "error") && isExpanded;

	// Handle opening Artifact
	const handleOpenArtifact = async () => {
		if (!toolState.isDocumentTool) {
			console.log("⚠️ Not a document tool, skipping artifact open");
			return;
		}

		// For creating documents, we can open them even before completion
		// For completed documents, we need a result with documentId
		const isCreating =
			status === "executing" ||
			toolState.state === "call" ||
			toolState.state === "partial-call";

		console.log("🎯 handleOpenArtifact called:", {
			isCreating,
			status,
			toolState: toolState.state,
			isSuccessful: toolState.isSuccessful,
			toolName: toolState.toolName,
		});

		if (isCreating) {
			console.log("📝 Opening streaming artifact...");
			// For creating documents, we set the artifact to be visible with basic info
			// DataStreamHandler will update the content and documentId as they stream in
			const args = toolState.args as {
				title?: string;
				content?: string;
				kind?: string;
				documentId?: string; // For updates
			};

			// Determine if this is an update or create based on documentId
			const isUpdate = !!args.documentId;
			const defaultTitle = isUpdate
				? "Updating Document..."
				: "Creating Document...";

			console.log("📝 Setting streaming artifact:", {
				title: args.title || defaultTitle,
				kind: args.kind || "text",
				isUpdate,
			});

			setArtifact((prev) => ({
				...prev, // Preserve any existing streaming data
				title: args.title || prev.title || defaultTitle,
				kind:
					(args.kind as "text" | "code" | "sheet" | "image") ||
					prev.kind ||
					"text",
				isVisible: true, // Make it visible
				status: "streaming",
				boundingBox: {
					top: window.innerHeight / 2 - 100,
					left: window.innerWidth / 2 - 200,
					width: 400,
					height: 200,
				},
			}));
			return;
		}

		// For completed documents, use the loadArtifact method to fetch data
		if (!toolState.isSuccessful) return;

		// Debug: Log the full tool invocation result
		console.log("📋 Full toolInvocation.result:", part.toolInvocation.result);
		console.log("📋 toolState.result:", toolState.result);

		// Get documentId and version from tool invocation result
		const toolResult = part.toolInvocation.result;

		// Extract documentId and version from unified tool result format
		let documentId: string | undefined;
		let version: number | undefined;

		if (toolResult && typeof toolResult === "object") {
			// Extract documentId (unified field name from our tools)
			if ("documentId" in toolResult) {
				documentId = (toolResult as Record<string, unknown>)
					.documentId as string;
			}

			// Extract version (unified field name from our tools)
			if ("version" in toolResult) {
				version = (toolResult as Record<string, unknown>).version as number;
			}

			// Fallback: try legacy field names
			if (!documentId && "id" in toolResult) {
				documentId = (toolResult as Record<string, unknown>).id as string;
			}
			if (!version && "versionNumber" in toolResult) {
				version = (toolResult as Record<string, unknown>)
					.versionNumber as number;
			}
		}

		console.log("📋 Extracted documentId:", documentId);
		console.log("📋 Extracted version:", version);

		if (!documentId) {
			console.error("❌ No documentId found in tool result:", toolResult);
			return;
		}

		// Create a mock bounding box (from screen center)
		const boundingBox = {
			top: window.innerHeight / 2 - 100,
			left: window.innerWidth / 2 - 200,
			width: 400,
			height: 200,
		};

		// Use loadAndShowArtifact to fetch and display the data
		console.log(
			"🚀 Loading artifact with documentId:",
			documentId,
			"version:",
			version,
		);
		await loadAndShowArtifact(documentId, boundingBox, version);
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
				part={part}
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
				part={part}
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
			part={part}
		/>
	);
}
