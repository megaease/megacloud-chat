// lib/ai/tools/update-document.ts
import { tool, type DataStreamWriter } from "ai";
import { z } from "zod";
import type { DataStreamDelta } from "@/lib/artifact-types";
import { updateArtifact, getArtifactById } from "@/server/db/queries/artifacts";

export function updateDocumentTool(
	dataStream: DataStreamWriter,
	userId?: string,
) {
	return tool({
		description: "Update an existing document artifact",
		parameters: z.object({
			documentId: z.string().describe("ID of the document to update"),
			title: z.string().optional().describe("New title of the document"),
			content: z.string().optional().describe("New content of the document"),
			kind: z
				.enum(["text", "code", "sheet", "image"])
				.optional()
				.describe("New type of document"),
			changeDescription: z
				.string()
				.optional()
				.describe("Description of changes made"),
		}),
		execute: async ({
			documentId,
			title,
			content,
			kind,
			changeDescription,
		}) => {
			// 验证文档是否存在且用户有权限
			if (userId) {
				const existingArtifact = await getArtifactById(documentId, userId);
				if (!existingArtifact) {
					throw new Error("Document not found or access denied");
				}
			}

			// 发送流式数据片段
			const streamParts: DataStreamDelta[] = [
				{ type: "id", content: documentId },
				...(title
					? [{ type: "title", content: title } as DataStreamDelta]
					: []),
				...(kind ? [{ type: "kind", content: kind } as DataStreamDelta] : []),
				{ type: "clear", content: "" },
				...(content ? splitContentToDeltas(content, kind || "text") : []),
				{ type: "finish", content: "" },
			];

			// 逐个发送数据片段，模拟流式效果
			for (const part of streamParts) {
				dataStream.writeData(part as any);
				// 添加小延迟模拟真实的流式体验
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			// 更新数据库（如果提供了userId）
			if (userId) {
				try {
					const updatedArtifact = await updateArtifact({
						artifactId: documentId,
						title,
						content,
						kind,
						userId,
						changeDescription: changeDescription || "Updated via AI assistant",
					});

					if (updatedArtifact) {
						console.log("Artifact updated in database:", updatedArtifact.id);
					}
				} catch (error) {
					console.error("Failed to update artifact in database:", error);
					// 不抛出错误，因为流式传输已经成功
				}
			}

			return { success: true, documentId };
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
