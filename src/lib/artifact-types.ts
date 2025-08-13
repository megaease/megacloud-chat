// lib/types.ts
export interface UIArtifact {
	documentId: string;
	title: string;
	kind: ArtifactKind;
	language?: ArtifactLanguage; // Language for code artifacts
	content: string;
	isVisible: boolean;
	status: "idle" | "streaming" | "error" | "loading";
	boundingBox: {
		top: number;
		left: number;
		width: number;
		height: number;
	};
}

export type ArtifactKind = "text" | "code" | "sheet" | "image";

export type ArtifactLanguage =
	| "html"
	| "react"
	| "javascript"
	| "python"
	| "css";

export interface DataStreamDelta {
	type:
		| "text"
		| "code-delta"
		| "sheet-delta"
		| "image-delta"
		| "title"
		| "id"
		| "kind"
		| "language" // 语言类型事件
		| "status" // 状态事件：creating, updating, streaming
		| "clear"
		| "finish"
		| "id-update"; // ID 更新事件
	content: string;
}

export interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	createdAt: Date;
}
