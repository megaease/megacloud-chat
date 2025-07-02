// lib/ai/tools/create-document-smart.ts
import { tool, type DataStreamWriter } from "ai";
import { z } from "zod";
import { nanoid } from "nanoid";
import type { DataStreamDelta } from "@/lib/artifact-types";
import {
	createArtifact,
	getChatArtifact,
	updateArtifact,
} from "@/server/db/queries/artifacts";

export function createDocumentTool(
	dataStream: DataStreamWriter,
	userId?: string,
	chatId?: string,
) {
	return tool({
		description:
			"Create a new document artifact when user explicitly requests substantial content creation (code, HTML, documents, etc.). Only use when user clearly wants to create, write, build, or generate specific content that is substantial and reusable. Do not use for simple conversations, single words, or brief responses.",
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
			forceNew: z
				.boolean()
				.optional()
				.default(false)
				.describe("Force create new document even if one exists in this chat"),
		}),
		execute: async ({ title, content, kind, language, forceNew }) => {
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

			let shouldCreateNew = true;
			let existingDocumentId: string | null = null;

			// Check if current chat already has artifact (only when userId and chatId are available)
			if (userId && chatId && !forceNew) {
				try {
					const existingArtifact = await getChatArtifact(chatId, userId);
					if (existingArtifact) {
						// If artifact exists, convert to update operation
						shouldCreateNew = false;
						existingDocumentId = existingArtifact.id;
						console.log(
							"Found existing artifact in chat, converting to update operation:",
							existingDocumentId,
						);
					}
				} catch (error) {
					console.warn(
						"Failed to check existing artifacts, proceeding with create:",
						error,
					);
				}
			}

			if (!shouldCreateNew && existingDocumentId) {
				// Convert to update operation
				console.log(
					"Converting createDocument to updateDocument for:",
					existingDocumentId,
				);

				// Send updating status first
				dataStream.writeData({ type: "status", content: "updating" } as {
					type: string;
					content: string;
				});

				// Send update process data
				dataStream.writeData({ type: "id", content: existingDocumentId } as {
					type: string;
					content: string;
				});
				dataStream.writeData({ type: "title", content: title } as {
					type: string;
					content: string;
				});
				// 重要：发送 kind 信息确保类型一致性
				dataStream.writeData({ type: "kind", content: kind } as {
					type: string;
					content: string;
				});
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

				// Stream content
				await generateContentStream(content, kind, dataStream);

				dataStream.writeData({ type: "finish", content: "" } as {
					type: string;
					content: string;
				});

				// Update database
				let updatedVersion = 1; // 默认版本号
				if (userId) {
					try {
						const updatedArtifact = await updateArtifact({
							artifactId: existingDocumentId,
							title,
							content,
							kind,
							language,
							userId,
							changeDescription: "Updated via AI assistant",
						});
						if (updatedArtifact) {
							updatedVersion = updatedArtifact.version; // 使用数据库返回的版本号
							console.log(
								"✅ Artifact updated successfully:",
								updatedArtifact.id,
								"version:",
								updatedArtifact.version,
							);
						}
					} catch (error) {
						console.error("❌ Failed to update artifact in database:", error);
					}
				}

				return {
					documentId: existingDocumentId,
					title,
					kind,
					language,
					success: true,
					operation: "updated",
					version: updatedVersion, // 从数据库返回的版本号
					content: "Document was updated and is now visible to the user.",
				};
			}

			// Original create logic
			const tempDocumentId = nanoid(16);

			// Send creating status first
			dataStream.writeData({ type: "status", content: "creating" } as {
				type: string;
				content: string;
			});

			// Send basic info immediately
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
			// Send language info (if available)
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

			// Stream content with delay to simulate real generation
			await generateContentStream(content, kind, dataStream);

			// End streaming
			dataStream.writeData({ type: "finish", content: "" } as {
				type: string;
				content: string;
			});

			// Save to database after streaming completes
			let realDocumentId = tempDocumentId;
			let createdArtifactVersion = 1; // 默认版本号
			if (userId && chatId) {
				try {
					console.log("Attempting to save artifact to database...");
					const createdArtifact = await createArtifact({
						id: tempDocumentId, // Use same ID
						title,
						content,
						kind,
						language,
						userId,
						chatId,
						tags: [],
						isPublic: false,
					});
					realDocumentId = createdArtifact.id;
					createdArtifactVersion = createdArtifact.version; // 使用数据库返回的版本号
					console.log(
						"✅ Artifact saved to database successfully:",
						createdArtifact.id,
						"version:",
						createdArtifact.version,
					);

					// No need to send ID update as ID remains consistent
				} catch (error) {
					console.error("❌ Failed to save artifact to database:", error);
					// Keep temp ID even if save fails to ensure frontend works
					// Possible reasons: DB connection issues, permission issues, etc.
				}
			} else {
				console.log("⚠️ Skipping database save - missing userId or chatId");
			}

			return {
				documentId: realDocumentId,
				title,
				kind,
				language,
				success: true,
				operation: "created",
				version: createdArtifactVersion, // 从数据库返回的版本号
				content: "A document was created and is now visible to the user.",
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

	// 发送 streaming 状态信号，表示开始流式传输内容
	dataStream.writeData({ type: "status", content: "streaming" } as {
		type: string;
		content: string;
	});

	// 适度延迟让状态切换有时间生效
	await new Promise((resolve) => setTimeout(resolve, 200));

	// Split content into smaller chunks for streaming effect
	const chunkSize = Math.max(1, Math.floor(content.length / 20));
	for (let i = 0; i < content.length; i += chunkSize) {
		const chunk = content.slice(i, i + chunkSize);
		dataStream.writeData({ type: deltaType, content: chunk } as {
			type: string;
			content: string;
		});
		// Add small delay to simulate real generation
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
}
