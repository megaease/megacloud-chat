import type { ToolInvocationPart as ToolInvocationPartType } from "@/types/tool-invocation";
import type { ResultContent } from "@/types/tool-invocation";
import { useEffect, useMemo, useState } from "react";
import type { ToolState, ToolStatus } from "./types";
function isDocumentToolName(toolName: string): boolean {
	return toolName === "createArtifactTool" || toolName === "updateArtifactTool";
}
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

		const isDocumentTool = isDocumentToolName(toolName);
		const isSuccessful = state === "result" && !hasError;

		// Extract result content; if content missing, fallback to the whole result object
		let result: ToolState["result"] = null;
		if (toolInvocation.result) {
			if ("content" in toolInvocation.result) {
				const c = (toolInvocation.result as { content?: unknown }).content;
				if (Array.isArray(c)) {
					result = c as Array<string | ResultContent>;
				} else if (typeof c === "string") {
					result = c as string;
				} else if (c && typeof c === "object") {
					result = c as Record<string, unknown>;
				} else {
					result = null;
				}
			} else {
				// no content field; fallback to whole result object
				result = toolInvocation.result as unknown as Record<string, unknown>;
			}
		}

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
