// lib/ai/tools/create-document.ts
import { tool, type DataStreamWriter } from "ai";
import { z } from "zod";
import type { DataStreamDelta } from "@/lib/artifact-types";
import { createArtifact } from "@/server/db/queries/artifacts";

export function createDocumentTool(
	dataStream: DataStreamWriter,
	userId?: string,
	chatId?: string,
) {
	return tool({
		description: "Create a new document artifact",
		parameters: z.object({
			title: z.string().describe("Title of the document"),
			content: z.string().describe("Content of the document"),
			kind: z
				.enum(["text", "code", "sheet", "image"])
				.describe("Type of document"),
		}),
		execute: async ({ title, content, kind }) => {
			// 先保存到数据库获取真实的ID（如果提供了必要的参数）
			let realDocumentId: string;

			if (userId && chatId) {
				try {
					const artifact = await createArtifact({
						title,
						content,
						kind,
						userId,
						chatId,
						tags: [],
						isPublic: false,
					});
					realDocumentId =
						artifact.id ||
						`artifact_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
					console.log("Artifact saved to database:", artifact.id);
				} catch (error) {
					console.error("Failed to save artifact to database:", error);
					// 如果保存失败，使用临时ID
					realDocumentId = `artifact_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
				}
			} else {
				// 如果没有提供userId和chatId，使用临时ID
				realDocumentId = `artifact_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
			}

			// 发送流式数据片段，使用真实的document ID
			const streamParts: DataStreamDelta[] = [
				{ type: "id", content: realDocumentId },
				{ type: "title", content: title },
				{ type: "kind", content: kind },
				{ type: "clear", content: "" },
				...splitContentToDeltas(content, kind),
				{ type: "finish", content: "" },
			];

			// 逐个发送数据片段，模拟流式效果
			for (const part of streamParts) {
				dataStream.writeData(part as any);
				// 添加小延迟模拟真实的流式体验
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			return { success: true, documentId: realDocumentId };
		},
	});
}

function splitContentToDeltas(
	content: string,
	kind: string,
): DataStreamDelta[] {
	const deltaType = `${kind}-delta` as DataStreamDelta["type"];
	const lines = content.split("\n");

	return lines.map((line, index) => ({
		type: deltaType,
		content: index === 0 ? line : `\n${line}`,
	}));
}
