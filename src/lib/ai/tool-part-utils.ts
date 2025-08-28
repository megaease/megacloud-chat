import type {
	ToolInvocationPart as ToolInvocationPartType,
	ToolInvocationResult,
} from "@/types/tool-invocation";

// AI SDK 5 specific types
type DynamicToolPart = {
	type: "dynamic-tool";
	toolName: string;
	toolCallId: string;
	state: string;
	input?: unknown;
	output?: unknown;
};

type StepStartPart = {
	type: "step-start";
};

type TextPart = {
	type: "text";
	text: string;
	state?: string;
};

type AnyPart = DynamicToolPart | StepStartPart | TextPart | { type?: string };

function normalizeArgs(input: unknown): Record<string, unknown> {
	return input && typeof input === "object"
		? (input as Record<string, unknown>)
		: {};
}

function normalizeResult(output: unknown): ToolInvocationResult | undefined {
	if (!output) return undefined;

	// If it's already a proper ToolInvocationResult-like object
	if (typeof output === "object") {
		return output as ToolInvocationResult;
	}

	// If it's a string, wrap it in content
	if (typeof output === "string") {
		return { content: output };
	}

	// Fallback
	return { content: String(output) };
}

function mapAISDK5State(
	state?: string,
): "call" | "partial-call" | "processing" | "result" {
	switch (state) {
		case "output-available":
			return "result";
		case "input-available":
		case "call-created":
		case "created":
			return "call";
		case "input-streaming":
		case "partial-call":
			return "partial-call";
		case "processing":
		case "running":
		case "executing":
			return "processing";
		default:
			// If there's output, it's likely completed
			return "processing";
	}
}

/**
 * Adapt AI SDK v5 dynamic-tool parts to our internal ToolInvocationPart format.
 * This function is specifically designed for AI SDK 5 and doesn't maintain backward compatibility.
 */
export function adaptToToolInvocationPart(
	part: AnyPart,
): ToolInvocationPartType | null {
	if (!part || typeof part !== "object") return null;

	const type = (part as { type?: string }).type;

	// Already adapted
	if (type === "tool-invocation") return part as ToolInvocationPartType;

	// AI SDK 5 dynamic-tool format
	if (type === "dynamic-tool") {
		const dynamicTool = part as DynamicToolPart;
		const result = normalizeResult(dynamicTool.output);

		return {
			type: "tool-invocation",
			toolInvocation: {
				toolName: dynamicTool.toolName,
				args: normalizeArgs(dynamicTool.input),
				state: mapAISDK5State(dynamicTool.state),
				...(result ? { result } : {}),
			},
		};
	}

	// Skip non-tool parts
	if (type === "step-start" || type === "text") {
		return null;
	}

	return null;
}

/**
 * Extract document info (documentId/id, version) from AI SDK v5 dynamic-tool parts.
 */
export function extractDocumentInfoFromPart(
	part: AnyPart,
): { toolName?: string; documentId?: string; version?: number } | null {
	if (!part || typeof part !== "object") return null;

	const type = (part as { type?: string }).type;

	if (type === "dynamic-tool") {
		const dynamicTool = part as DynamicToolPart;
		const output = dynamicTool.output;

		if (output && typeof output === "object") {
			const result = output as Record<string, unknown>;
			const documentId = (result.documentId as string) || (result.id as string);
			const version = result.version as number;

			if (documentId) {
				return {
					toolName: dynamicTool.toolName,
					documentId,
					version,
				};
			}
		}
	}

	// Also try to adapt first and then extract
	const adapted = adaptToToolInvocationPart(part);
	if (adapted) {
		const { toolInvocation } = adapted;
		const result = toolInvocation.result;
		if (result && typeof result === "object") {
			const r = result as Record<string, unknown>;
			const documentId = (r.documentId as string) || (r.id as string);
			const version = r.version as number;
			if (documentId) {
				return {
					toolName: toolInvocation.toolName,
					documentId,
					version,
				};
			}
		}
	}

	return null;
}
