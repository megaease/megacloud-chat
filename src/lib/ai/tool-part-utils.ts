import type { ToolInvocationPart as ToolInvocationPartType } from "@/types/tool-invocation";

// Minimal shape guards
type AnyPart = unknown & { type?: string };

function safeParseJSON(input: unknown): unknown {
	if (typeof input !== "string") return input;
	try {
		return JSON.parse(input);
	} catch {
		return input;
	}
}

function normalizeArgs(input: unknown): Record<string, unknown> {
	const parsed = safeParseJSON(input);
	return parsed && typeof parsed === "object"
		? (parsed as Record<string, unknown>)
		: { value: parsed };
}

function normalizeResult(
	output: unknown,
): Record<string, unknown> | { content: string } | undefined {
	const parsed = safeParseJSON(output);
	if (parsed == null) return undefined;
	if (typeof parsed === "string") return { content: parsed };
	if (typeof parsed === "object") return parsed as Record<string, unknown>;
	return { content: String(parsed) };
}

function mapState(
	raw?: string,
	hasResult?: boolean,
): "call" | "partial-call" | "processing" | "result" {
	if (hasResult) return "result";
	switch (raw) {
		case "output-available":
			return "result";
		case "input-available":
		case "call-created":
		case "created":
			return "call";
		case "input-streaming":
			return "partial-call";
		default:
			return "processing";
	}
}

/**
 * Adapt various AI SDK v5 tool parts (tool-call, tool-result, tool-*, tool-invocation)
 * into the project-wide ToolInvocationPart format.
 */
export function adaptToToolInvocationPart(
	part: AnyPart,
): ToolInvocationPartType | null {
	if (!part || typeof part !== "object") return null;
	const type = (part as { type?: string }).type;

	// Already adapted
	if (type === "tool-invocation") return part as ToolInvocationPartType;

	// v5 generic tool-call/tool-result
	if (type === "tool-call") {
		const toolName = (part as { toolName?: string }).toolName || "";
		const input = (part as { input?: unknown }).input;
		return {
			type: "tool-invocation",
			toolInvocation: {
				toolName,
				args: normalizeArgs(input),
				state: "call",
			},
		};
	}
	if (type === "tool-result") {
		const toolName = (part as { toolName?: string }).toolName || "";
		const output = (part as { output?: unknown }).output;
		const result = normalizeResult(output);
		return {
			type: "tool-invocation",
			toolInvocation: {
				toolName,
				args: {},
				state: "result",
				...(result ? { result } : {}),
			},
		};
	}

	// v5 UI named tool parts: type === `tool-<name>`
	if (type?.startsWith("tool-")) {
		const toolName = type.slice("tool-".length);
		const input = (part as { input?: unknown }).input;
		const output = (part as { output?: unknown }).output;
		const state = (part as { state?: string }).state;
		const result = normalizeResult(output);
		return {
			type: "tool-invocation",
			toolInvocation: {
				toolName,
				args: normalizeArgs(input),
				state: mapState(state, !!result),
				...(result ? { result } : {}),
			},
		};
	}

	return null;
}

/**
 * Extract document info (documentId/id, version) from any tool-ish part.
 */
export function extractDocumentInfoFromPart(
	part: AnyPart,
): { toolName?: string; documentId?: string; version?: number } | null {
	const adapted = adaptToToolInvocationPart(part);
	if (adapted) {
		const { toolInvocation } = adapted;
		const result = toolInvocation.result;
		if (result && typeof result === "object") {
			const r = result as Record<string, unknown>;
			const documentId =
				(r.documentId as string) || (r.id as string) || undefined;
			const version = (r.version as number) || undefined;
			if (documentId)
				return { toolName: toolInvocation.toolName, documentId, version };
		}
	}
	// fallback for direct v5 tool-result / tool-* with output already handled above in adapt
	if (part && typeof part === "object") {
		const type = (part as { type?: string }).type;
		const isNamed = type?.startsWith("tool-") ?? false;
		if (type === "tool-result" || isNamed) {
			const toolName =
				isNamed && type
					? type.slice(5)
					: (part as { toolName?: string }).toolName;
			const parsed = safeParseJSON((part as { output?: unknown }).output);
			const payload =
				parsed && typeof parsed === "object"
					? (parsed as Record<string, unknown>)
					: undefined;
			const documentId = payload
				? (payload.documentId as string) || (payload.id as string)
				: undefined;
			const version = payload
				? (payload.version as number | undefined)
				: undefined;
			if (documentId) return { toolName, documentId, version };
		}
	}
	return null;
}
