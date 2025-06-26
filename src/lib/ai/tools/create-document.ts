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
			dataStream.writeData({ type: "kind", content: kind } as {
				type: string;
				content: string;
			});
			dataStream.writeData({ type: "id", content: tempDocumentId } as {
				type: string;
				content: string;
			});
			dataStream.writeData({ type: "title", content: title } as {
				type: string;
				content: string;
			});
			dataStream.writeData({ type: "clear", content: "" } as {
				type: string;
				content: string;
			});

			// 流式发送内容，添加延迟模拟真实生成
			await generateContentStream(content, kind, dataStream);

			// 结束流式传输
			dataStream.writeData({ type: "finish", content: "" } as {
				type: string;
				content: string;
			});

			// 流式传输完成后再保存到数据库
			let realDocumentId = tempDocumentId;
			if (userId && chatId) {
				try {
					console.log("Attempting to save artifact to database...");
					const artifact = await createArtifact({
						id: tempDocumentId, // 使用相同的 ID
						title,
						content,
						kind,
						userId,
						chatId,
						tags: [],
						isPublic: false,
					});
					realDocumentId = artifact.id || tempDocumentId;
					console.log(
						"✅ Artifact saved to database successfully:",
						artifact.id,
					);

					// 不需要发送 ID 更新，因为 ID 保持一致
				} catch (error) {
					console.error("❌ Failed to save artifact to database:", error);
					// 即使保存失败，也保持临时 ID，确保前端能正常显示
					// 可能的原因：数据库连接问题、权限问题等
				}
			} else {
				console.log("⚠️ Skipping database save - missing userId or chatId");
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

	// 模拟真正的流式生成：按小块发送内容（类似Claude Artifacts）
	const chunkSize = 3; // 每次发送3个字符

	for (let i = 0; i < content.length; i += chunkSize) {
		const chunk = content.slice(i, i + chunkSize);

		// 添加延迟模拟真实的流式生成（更快的速度）
		await new Promise((resolve) => setTimeout(resolve, 50));

		dataStream.writeData({
			type: deltaType,
			content: chunk,
		} as { type: string; content: string });
	}
}
