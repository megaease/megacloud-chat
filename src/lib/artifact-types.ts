// lib/types.ts
export interface UIArtifact {
	documentId: string;
	title: string;
	kind: ArtifactKind;
	language?: ArtifactLanguage; // Language for code artifacts
	content: string;
	isVisible: boolean;
	status: "streaming" | "idle" | "error";
	boundingBox: {
		top: number;
		left: number;
		width: number;
		height: number;
	};
	// 新增字段用于数据来源控制
	dataSource: "stream" | "database" | "version";
	isStreaming: boolean;
	streamingProgress?: number;
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
		| "text-delta"
		| "code-delta"
		| "sheet-delta"
		| "image-delta"
		| "title"
		| "id"
		| "kind"
		| "language" // 新增：语言类型事件
		| "clear"
		| "finish"
		| "id-update"; // 新增：ID 更新事件
	content: string;
}

export interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	createdAt: Date;
}
