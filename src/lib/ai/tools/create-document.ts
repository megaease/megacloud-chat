// lib/ai/tools/create-document-smart.ts
import { tool, type DataStreamWriter } from "ai";
import { z } from "zod";
import { nanoid } from "nanoid";
import type { DataStreamDelta } from "@/lib/artifact-types";
import { createArtifact, getArtifactsByChatId, updateArtifact } from "@/server/db/queries/artifacts";

export function createDocumentTool(
	dataStream: DataStreamWriter,
	userId?: string,
	chatId?: string,
) {
	return tool({
		description: "Create a new document artifact or update existing one in the current chat",
		parameters: z.object({
			title: z.string().describe("Title of the document"),
			content: z.string().describe("Content of the document"),
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
			let shouldCreateNew = true;
			let existingDocumentId: string | null = null;

			// Check if current chat already has artifact (only when userId and chatId are available)
			if (userId && chatId && !forceNew) {
				try {
					const existingArtifacts = await getArtifactsByChatId(chatId, userId);
					if (existingArtifacts.length > 0 && existingArtifacts[0]) {
						// If artifact exists, convert to update operation
						shouldCreateNew = false;
						existingDocumentId = existingArtifacts[0].id;
						console.log("Found existing artifact in chat, converting to update operation:", existingDocumentId);
					}
				} catch (error) {
					console.warn("Failed to check existing artifacts, proceeding with create:", error);
				}
			}

			if (!shouldCreateNew && existingDocumentId) {
				// Convert to update operation
				console.log("Converting createDocument to updateDocument for:", existingDocumentId);
				
				// Send update process data
				dataStream.writeData({ type: "id", content: existingDocumentId } as {
					type: string;
					content: string;
				});
				dataStream.writeData({ type: "title", content: title } as {
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
						console.log("Artifact updated successfully:", updatedArtifact?.id);
					} catch (error) {
						console.error("Failed to update artifact in database:", error);
					}
				}

				return {
					documentId: existingDocumentId,
					title,
					kind,
					language,
					success: true,
					operation: "updated",
					content: "Document was updated and is now visible to the user.",
				};
			}

			// Original create logic
			const tempDocumentId = nanoid(16);

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
			if (userId && chatId) {
				try {
					console.log("Attempting to save artifact to database...");
					const artifact = await createArtifact({
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
					realDocumentId = artifact.id || tempDocumentId;
					console.log(
						"✅ Artifact saved to database successfully:",
						artifact.id,
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
