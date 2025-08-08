import { tool } from "ai";
import { z } from "zod";
import { updateArtifact } from "@/server/db/queries/artifacts";

// Update an existing document (logical no-op for now; returns structured result)
export const updateDocumentInputSchema = z.object({
	documentId: z.string().min(1).describe("The ID of the document to update"),
	content: z
		.string()
		.min(1)
		.describe("The full new content to replace the document with"),
	note: z.string().optional().describe("Optional note describing the change"),
});

export const updateDocumentTool = tool({
	description:
		"Update an existing document's content with an optional change note.",
	inputSchema: updateDocumentInputSchema,
	execute: async ({ documentId, content, note }, { experimental_context }) => {
		const ctx = (experimental_context || {}) as { userId?: string };
		if (!ctx.userId) {
			return {
				success: false,
				action: "update-document",
				documentId,
				error: "Missing userId context for persistence.",
				preview: content.slice(0, 500),
				contentLength: content.length,
				note: note ?? null,
			} as const;
		}

		const updated = await updateArtifact({
			artifactId: documentId,
			userId: ctx.userId,
			content,
			changeDescription: note ?? "updateDocument invoked",
		});

		return {
			success: updated != null,
			action: "update-document",
			documentId,
			version: updated?.version,
			preview: content.slice(0, 500),
			contentLength: content.length,
			note: note ?? null,
		} as const;
	},
});

export type UpdateDocumentParams = z.infer<typeof updateDocumentInputSchema>;
