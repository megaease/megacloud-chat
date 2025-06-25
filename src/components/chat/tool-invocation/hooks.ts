import { useState, useMemo, useEffect } from "react";
import type { ToolInvocationPart as ToolInvocationPartType } from "@/types/tool-invocation";
import type { ToolState, ToolStatus } from "./types";

export function useToolInvocationState(part: ToolInvocationPartType) {
	const { toolInvocation } = part;
	const { toolName, state, args } = toolInvocation;
	const [isExpanded, setIsExpanded] = useState(false);
	const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

	const toolState: ToolState = useMemo(() => {
		const hasError = toolInvocation.result?.isError || false;
		const errorMessage = hasError
			? toolInvocation.result?.error || "Unknown error"
			: null;

		const isDocumentTool =
			toolName === "createDocument" || toolName === "updateDocument";
		const isSuccessful = state === "result" && !hasError;

		// Extract result content
		const result = toolInvocation.result?.content || null;

		return {
			toolName,
			state,
			args,
			hasError,
			errorMessage,
			isSuccessful,
			isDocumentTool,
			result,
		};
	}, [toolInvocation, toolName, state, args]);

	const status: ToolStatus = useMemo(() => {
		// 更详细的状态判断，确保能正确识别执行状态
		if (toolState.hasError) return "error";
		if (state === "call" || state === "partial-call" || state === "processing")
			return "executing";
		if (state === "result") return "success";
		return "idle";
	}, [toolState.hasError, state]);

	// 为文档工具自动展开执行状态 (仅一次)
	useEffect(() => {
		if (
			toolState.isDocumentTool &&
			status === "executing" &&
			!hasAutoExpanded
		) {
			setIsExpanded(true);
			setHasAutoExpanded(true);
		}
		// Auto-expand on error (only once)
		if (toolState.hasError && !hasAutoExpanded) {
			setIsExpanded(true);
			setHasAutoExpanded(true);
		}
	}, [toolState.isDocumentTool, toolState.hasError, status, hasAutoExpanded]);

	return {
		toolState,
		status,
		isExpanded,
		setIsExpanded,
		toggleExpanded: () => setIsExpanded(!isExpanded),
	};
}
