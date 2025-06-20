// lib/types.ts
export interface UIArtifact {
	documentId: string;
	title: string;
	kind: ArtifactKind;
	content: string;
	isVisible: boolean;
	status: "streaming" | "idle" | "error";
	boundingBox: {
		top: number;
		left: number;
		width: number;
		height: number;
	};
}

export type ArtifactKind = "text" | "code" | "sheet" | "image";

export interface DataStreamDelta {
	type:
		| "text-delta"
		| "code-delta"
		| "sheet-delta"
		| "image-delta"
		| "title"
		| "id"
		| "kind"
		| "clear"
		| "finish";
	content: string;
}

export interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	createdAt: Date;
}
