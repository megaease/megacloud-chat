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
		description: "Update an existing document artifact when user explicitly requests changes to an existing document. Only use when user clearly wants to modify, edit, or update specific content in an existing artifact.",
		parameters: z.object({
			documentId: z.string().describe("ID of the document to update"),
			title: z.string().optional().describe("New title of the document"),
			content: z.string().optional().describe("New content of the document"),
			kind: z
				.enum(["text", "code", "sheet", "image"])
				.optional()
				.describe("New type of document"),
			language: z
				.enum(["html", "react", "javascript", "python", "css"])
				.optional()
				.describe("Programming language for code documents"),
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
			language,
			changeDescription,
		}) => {
			// 验证文档是否存在且用户有权限，同时获取现有信息
			let existingArtifact = null;
			if (userId) {
				existingArtifact = await getArtifactById(documentId, userId);
				if (!existingArtifact) {
					throw new Error("Document not found or access denied");
				}
			}

			// 立即发送基础信息
			dataStream.writeData({ type: "id", content: documentId } as {
				type: string;
				content: string;
			});

			if (title) {
				dataStream.writeData({ type: "title", content: title } as {
					type: string;
					content: string;
				});
			}

			if (kind) {
				dataStream.writeData({ type: "kind", content: kind } as {
					type: string;
					content: string;
				});
			}

			if (language) {
				dataStream.writeData({ type: "language", content: language } as {
					type: string;
					content: string;
				});
			}

			dataStream.writeData({ type: "clear", content: "" } as {
				type: string;
				content: string;
			});

			// 如果有内容更新，流式发送
			if (content) {
				await generateContentStream(content, kind || "text", dataStream);
			}

			dataStream.writeData({ type: "finish", content: "" } as {
				type: string;
				content: string;
			});

			// 更新数据库（如果提供了 userId）
			// Save updated artifact to database after streaming completes
			let updatedArtifactVersion = existingArtifact?.version || 1; // 默认使用现有版本号
			if (userId) {
				try {
					const updatedArtifact = await updateArtifact({
						artifactId: documentId,
						title,
						content,
						kind,
						language,
						userId,
						changeDescription: changeDescription || "Updated via AI assistant",
					});

					if (updatedArtifact) {
						updatedArtifactVersion = updatedArtifact.version; // 使用数据库返回的新版本号
						console.log(
							"✅ Artifact updated in database:",
							updatedArtifact.id,
							"version:",
							updatedArtifact.version,
						);
					}
				} catch (error) {
					console.error("❌ Failed to update artifact in database:", error);
					// 不抛出错误，因为流式传输已经成功
				}
			}

			// 统一返回值格式，与 createDocumentTool 保持一致
			return {
				documentId,
				title: title || existingArtifact?.title || "Untitled",
				kind: kind || existingArtifact?.kind || "text",
				language: language || existingArtifact?.language,
				version: updatedArtifactVersion, // 从数据库返回的版本号
				success: true,
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

	// 模拟真正的流式生成：按小块发送内容（类似 Claude Artifacts）
	const chunkSize = 3; // 每次发送 3 个字符

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
