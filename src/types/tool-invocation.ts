export interface ResultContent {
	type: "text" | "code" | "markdown";
	text: string;
}

export interface ToolInvocationResult {
	isError?: boolean;
	error?: string;
	content?: Array<ResultContent | string> | string;
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

export interface StepStartPart {
	type: "step-start";
}

export interface ReasoningPart {
	type: "reasoning";
}

export interface SourcePart {
	type: "source";
}

export interface FilePart {
	type: "file";
	content: string;
	name?: string;
}

export type MessagePart =
	| string
	| TextPart
	| ToolInvocationPart
	| StepStartPart
	| ReasoningPart
	| SourcePart
	| FilePart;

export interface UIMessage {
	id: string;
	role: "user" | "assistant" | "system" | "function" | "data" | "tool";
	content: string | any[];
	createdAt?: Date;
	name?: string;
	parts?: any[];
	isLatest?: boolean;
}
