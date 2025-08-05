// lib/ai/tools/update-document.ts
import { tool, type DataStreamWriter } from "ai";
import { z } from "zod";
import type { DataStreamDelta } from "@/lib/artifact-types";
import { 
	updateArtifact, 
	getArtifactById, 
	getChatArtifact 
} from "@/server/db/queries/artifacts";
import type { Artifact } from "@/server/db/schema";

export function updateDocumentTool(
	dataStream: DataStreamWriter,
	userId?: string,
	chatId?: string,
) {
	return tool({
		description: "Update or modify an EXISTING document in the current chat. Use this when the user wants to: modify existing content, convert format (e.g., text to HTML), enhance features, make changes, add elements, redesign, or transform existing documents. TRIGGER KEYWORDS: 'make it a webpage', 'convert to HTML', 'turn into', 'redesign', 'add styling', 'improve', 'enhance', 'modify', 'change', 'update', 'transform', 'adapt', 'convert this', 'make this into'. Do NOT use for initial creation - use createDocument instead.",
		parameters: z.object({
			title: z.string().min(3).describe("New title for the document (minimum 3 characters)"),
			content: z.string().min(10).describe("New content for the document (minimum 10 characters)"),
			kind: z
				.enum(["text", "code", "sheet", "image"])
				.describe("Type of document"),
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
			title,
			content,
			kind,
			language,
			changeDescription,
		}) => {
			// Validation
			if (!title || title.trim().length < 3) {
				throw new Error("Title must be at least 3 characters long");
			}
			if (!content || content.trim().length < 10) {
				throw new Error("Content must be at least 10 characters long");
			}
			
			if (!userId || !chatId) {
				throw new Error("User ID and Chat ID are required for updating documents");
			}

			// Find existing document in this chat
			let existingArtifact: Artifact | null;
			try {
				existingArtifact = await getChatArtifact(chatId, userId);
				if (!existingArtifact) {
					throw new Error("No existing document found in this chat. Please create a new document first.");
				}
			} catch (error) {
				console.error("Failed to find existing artifact:", error);
				throw new Error("Could not find existing document to update. Please create a new document first.");
			}

			const documentId = existingArtifact.id;

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

			// Update document in database
			let artifactVersion = existingArtifact.version + 1; // Default next version
			
			try {
				console.log("Updating existing artifact with new version...");
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
					artifactVersion = updatedArtifact.version;
					console.log(
						"✅ Artifact updated successfully:",
						updatedArtifact.id,
						"version:",
						updatedArtifact.version,
					);
				}
			} catch (error) {
				console.error("❌ Failed to update artifact in database:", error);
				throw new Error("Failed to update document in database");
			}

			return {
				documentId,
				title,
				kind,
				language,
				success: true,
				operation: "updated",
				version: artifactVersion,
				content: "The document was updated and is now visible to the user.",
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
