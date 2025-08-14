import type { StreamDelta } from "@/types/stream-delta";
import type { Artifact } from "@/hooks/use-artifact";

export interface ArtifactDefinition {
	kind: Artifact["kind"];
	displayName: string;
	onStreamPart?: (args: {
		streamPart: StreamDelta;
		setArtifact: (updater: (draft: Artifact) => Artifact) => void;
		setMetadata: (metadata: Record<string, unknown>) => void;
	}) => void;
}

// 智能显示时机判断函数
function shouldShowArtifact(
	kind: Artifact["kind"],
	content: string,
	streamPartType: string,
	isFirstContent: boolean,
): boolean {
	switch (kind) {
		case "text":
			// 文本类型：在 stream 过程中尽早显示
			if (content.length === 0 && isFirstContent) {
				return false; // 初始状态不显示
			}
			// 包含标题、列表、代码块等结构时立即显示
			{
				const hasStructure = /#{1,6}\s|\n\s*[-*+]\s|\n\s*\d+\.\s|```/.test(
					content,
				);
				if (hasStructure) return true;
			}
			// 在 stream 过程中，内容超过 10 个字符就显示（降低阈值）
			return content.length > 10;

		case "code":
			// 代码类型：避免闪动，设置更合理的显示逻辑
			if (content.length === 0 && isFirstContent) {
				return false; // 初始状态不显示
			}
			// 包含函数定义、类定义、导入语句等立即显示
			{
				const hasCodeStructure =
					/(function|class|def|import|export|const|let|var)\s/.test(content);
				if (hasCodeStructure) return true;
			}
			// 在 stream 过程中，避免频繁显示隐藏，设置更高的阈值
			// 同时检查是否有实质性的代码内容（不仅仅是空白字符）
			{
				const hasSubstantialContent = content.trim().length > 10;
				const hasMultipleLines = content.split("\n").length > 2;
				return hasSubstantialContent || hasMultipleLines;
			}

		case "sheet":
			// 表格类型：在 stream 过程中尽早显示
			if (content.length === 0 && isFirstContent) {
				return false; // 初始状态不显示
			}
			// 包含表格分隔符时立即显示
			{
				const hasTableStructure = /\|.*\|/.test(content);
				if (hasTableStructure) return true;
			}
			// 在 stream 过程中，内容超过 3 个字符就显示（降低阈值）
			return content.length > 3;

		case "image":
			// 图片类型：有内容时立即显示
			return content.length > 0;

		default:
			return false;
	}
}

export const artifactDefinitions: ArtifactDefinition[] = [
	{
		kind: "text",
		displayName: "Text Document",
		onStreamPart: ({ streamPart, setArtifact }) => {
			if (streamPart.type === "data-textDelta") {
				setArtifact((draft) => {
					// 文本类型：追加内容
					const newContent = draft.content + (streamPart.data as string);
					const isFirstContent = draft.content.length === 0;

					return {
						...draft,
						content: newContent,
						// 智能判断显示时机
						isVisible: shouldShowArtifact(
							"text",
							newContent,
							streamPart.type,
							isFirstContent,
						),
					};
				});
			}
		},
	},
	{
		kind: "code",
		displayName: "Code Document",
		onStreamPart: ({ streamPart, setArtifact }) => {
			if (streamPart.type === "data-codeDelta") {
				setArtifact((draft) => {
					const newContent = draft.content + (streamPart.data as string);
					const isFirstContent = draft.content.length === 0;

					return {
						...draft,
						content: newContent,
						// 智能判断显示时机
						isVisible: shouldShowArtifact(
							"code",
							newContent,
							streamPart.type,
							isFirstContent,
						),
					};
				});
			}
		},
	},
	{
		kind: "sheet",
		displayName: "Spreadsheet",
		onStreamPart: ({ streamPart, setArtifact }) => {
			if (streamPart.type === "data-sheetDelta") {
				setArtifact((draft) => {
					const newContent = draft.content + (streamPart.data as string);
					const isFirstContent = draft.content.length === 0;

					return {
						...draft,
						content: newContent,
						// 智能判断显示时机
						isVisible: shouldShowArtifact(
							"sheet",
							newContent,
							streamPart.type,
							isFirstContent,
						),
					};
				});
			}
		},
	},
	{
		kind: "image",
		displayName: "Image",
		onStreamPart: ({ streamPart, setArtifact }) => {
			if (streamPart.type === "data-imageDelta") {
				setArtifact((draft) => {
					const newContent = streamPart.data as string;
					const isFirstContent = draft.content.length === 0;

					return {
						...draft,
						content: newContent,
						// 智能判断显示时机
						isVisible: shouldShowArtifact(
							"image",
							newContent,
							streamPart.type,
							isFirstContent,
						),
					};
				});
			}
		},
	},
];
