// lib/ai/tools/create-document.ts
import { tool, type DataStreamWriter } from "ai";
import { z } from "zod";
import { nanoid } from "nanoid";
import type { DataStreamDelta } from "@/lib/artifact-types";
import {
	createArtifact,
} from "@/server/db/queries/artifacts";

export function createDocumentTool(
	dataStream: DataStreamWriter,
	userId?: string,
	chatId?: string,
) {
	return tool({
		description:
			"Create a NEW document artifact for the FIRST TIME in this conversation. Use this ONLY for initial document creation when no document exists yet. TRIGGER KEYWORDS: 'write', 'create', 'build', 'generate', 'make', 'develop', 'code', 'script', 'article', 'document', 'webpage' (when creating from scratch). Examples: 'write an article about...', 'create a webpage for...', 'make a Python script that...', 'build a calculator app'. Do NOT use if the user wants to modify, enhance, convert, or update existing content - use updateDocument instead.",
		parameters: z.object({
			title: z.string().min(3).describe("Descriptive title of the document (minimum 3 characters)"),
			content: z.string().min(10).describe("Substantial content of the document (minimum 10 characters)"),
			kind: z
				.enum(["text", "code", "sheet", "image"])
				.describe("Type of document"),
			language: z
				.enum(["html", "react", "javascript", "python", "css"])
				.optional()
				.describe("Programming language for code documents"),
		}),
		execute: async ({ title, content, kind, language }) => {
			// Additional validation to prevent accidental triggers
			if (!title || title.trim().length < 3) {
				throw new Error("Title must be at least 3 characters long");
			}
			if (!content || content.trim().length < 10) {
				throw new Error("Content must be at least 10 characters long");
			}
			
			// Check for obvious non-content patterns
			const trimmedContent = content.trim();
			const trimmedTitle = title.trim();
			
			// Prevent creation for single words/numbers/characters
			if (/^[0-9]+$/.test(trimmedContent) || /^[a-zA-Z]+$/.test(trimmedContent) && trimmedContent.length < 5) {
				throw new Error("Content appears to be too simple for document creation");
			}
			
			if (/^[0-9]+$/.test(trimmedTitle) || /^[a-zA-Z]+$/.test(trimmedTitle) && trimmedTitle.length < 5) {
				throw new Error("Title appears to be too simple for document creation");
			}

			// Generate unique document ID for new document
			const documentId = nanoid(16);

			// Send basic info immediately
			dataStream.writeData({ 
				type: "kind", 
				content: kind 
			});
			dataStream.writeData({ 
				type: "id", 
				content: documentId 
			});
			dataStream.writeData({ 
				type: "title", 
				content: title 
			});
			// Send language info (if available)
			if (language) {
				dataStream.writeData({ 
					type: "language", 
					content: language 
				});
			}
			dataStream.writeData({ 
				type: "clear", 
				content: "" 
			});

			// Stream content with delay to simulate real generation
			await generateContentStream(content, kind, dataStream);

			// End streaming
			dataStream.writeData({ 
				type: "finish", 
				content: "" 
			});

			// Save to database after streaming completes
			let artifactVersion = 1; // 新文档默认版本号
			
			if (userId && chatId) {
				try {
					console.log("Creating new artifact...");
					const createdArtifact = await createArtifact({
						id: documentId,
						title,
						content,
						kind,
						language,
						userId,
						chatId,
						tags: [],
						isPublic: false,
					});
					artifactVersion = createdArtifact.version;
					console.log(
						"✅ Artifact created successfully:",
						createdArtifact.id,
						"version:",
						createdArtifact.version,
					);
				} catch (error) {
					console.error("❌ Failed to save artifact to database:", error);
					// Keep working even if save fails to ensure frontend works
				}
			} else {
				console.log("⚠️ Skipping database save - missing userId or chatId");
			}

			return {
				documentId,
				title,
				kind,
				language,
				success: true,
				operation: "created",
				version: artifactVersion,
				content: "A new document was created and is now visible to the user.",
			};
		},
	});
}

// Real streaming content generation function
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
