import { useState, useMemo } from "react";
import type { ToolInvocationPart as ToolInvocationPartType } from "@/types/tool-invocation";
import type { ToolState, ToolStatus } from "./types";

export function useToolInvocationState(part: ToolInvocationPartType) {
	const { toolInvocation } = part;
	const { toolName, state, args } = toolInvocation;
	const [isExpanded, setIsExpanded] = useState(false);

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
		if (toolState.hasError) return "error";
		if (state === "call" || state === "partial-call") return "executing";
		if (state === "result") return "success";
		return "idle";
	}, [toolState.hasError, state]);

	// Auto-expand on error
	if (toolState.hasError && !isExpanded) {
		setIsExpanded(true);
	}

	return {
		toolState,
		status,
		isExpanded,
		setIsExpanded,
		toggleExpanded: () => setIsExpanded(!isExpanded),
	};
}
