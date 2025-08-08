export interface ResultContent {
	type: "text" | "code" | "markdown";
	text: string;
}

export interface ToolInvocationResult {
	isError?: boolean;
	error?: string;
	// Allow either plain content or structured object results (e.g., tool outputs)
	content?: Array<ResultContent | string> | string | Record<string, unknown>;
	// Additional fields from tool outputs (e.g., id, version, success, etc.)
	[key: string]: unknown;
}

export interface ToolInvocation {
	toolName: string;
	args: Record<string, unknown>;
	state: "result" | "processing" | "partial-call" | "call";
	step?: number;
	result?: ToolInvocationResult;
}

export interface ToolInvocationPart {
	type: "tool-invocation";
	toolInvocation: ToolInvocation;
}

export interface TextPart {
	type: "text";
	text: string;
}

// AI SDK v5 tool parts (adaptation layer)
export interface ToolCallPart {
	type: "tool-call";
	toolName: string;
	input?: unknown; // stringified JSON or object
}

export interface ToolResultPart {
	type: "tool-result";
	toolName: string;
	output?: unknown; // stringified JSON or object
}

export interface StepStartPart {
	type: "step-start";
}

export interface ReasoningPart {
	type: "reasoning";
	reasoningText: string;
	details?: TextPart[];
}

export interface SourcePart {
	type: "source";
}

export interface FilePart {
	type: "file";
	content: string;
	name?: string;
}

export interface ImagePart {
	type: "image";
	src: string;
	alt?: string;
	width?: number;
	height?: number;
}

export interface PDFPart {
	type: "pdf";
	src: string;
}

export interface TextFilePart {
	type: "text-file";
	content: string;
	name: string;
}

export type MessagePart =
	| string
	| TextPart
	| ToolInvocationPart
	| ToolCallPart
	| ToolResultPart
	| StepStartPart
	| ReasoningPart
	| SourcePart
	| FilePart
	| ImagePart
	| PDFPart
	| TextFilePart
	| ReasoningPart;

export interface UIMessage {
	id: string;
	role: "user" | "assistant" | "system" | "function" | "data" | "tool";
	content: string | MessagePart[];
	createdAt?: Date;
	name?: string;
	parts?: MessagePart[];
	isLatest?: boolean;
	experimental_attachments?: Array<{
		name?: string;
		url: string;
		contentType?: string;
	}>;
}
