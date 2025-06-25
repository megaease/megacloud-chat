// lib/ai/tools/create-document.ts
import { tool, type DataStreamWriter } from "ai";
import { z } from "zod";
import { nanoid } from "nanoid";
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
			// 生成临时 ID，立即开始流式传输
			const tempDocumentId = nanoid(16);

			// 立即发送基础信息
			dataStream.writeData({ type: "kind", content: kind } as { type: string; content: string });
			dataStream.writeData({ type: "id", content: tempDocumentId } as { type: string; content: string });
			dataStream.writeData({ type: "title", content: title } as { type: string; content: string });
			dataStream.writeData({ type: "clear", content: "" } as { type: string; content: string });

			// 流式发送内容，添加延迟模拟真实生成
			await generateContentStream(content, kind, dataStream);

			// 结束流式传输
			dataStream.writeData({ type: "finish", content: "" } as { type: string; content: string });

			// 流式传输完成后再保存到数据库
			let realDocumentId = tempDocumentId;
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
					realDocumentId = artifact.id || tempDocumentId;
					console.log("Artifact saved to database:", artifact.id);
					
					// 发送真实 ID 更新
					dataStream.writeData({ 
						type: "id-update", 
						content: realDocumentId 
					} as { type: string; content: string });
				} catch (error) {
					console.error("Failed to save artifact to database:", error);
					// 保持临时 ID
				}
			}

			return {
				id: realDocumentId,
				title,
				kind,
				content: "A document was created and is now visible to the user.",
			};
		},
	});
}

// 真正的流式内容生成函数
async function generateContentStream(
	content: string,
	kind: string,
	dataStream: DataStreamWriter,
) {
	const deltaType = `${kind}-delta` as DataStreamDelta["type"];

	// 模拟真正的流式生成：逐行发送内容
	const lines = content.split("\n");

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const lineContent = i === 0 ? line : `\n${line}`;

		// 添加小延迟模拟真实的流式生成
		await new Promise((resolve) => setTimeout(resolve, 20));

		dataStream.writeData({
			type: deltaType,
			content: lineContent,
		} as { type: string; content: string });
	}
}
