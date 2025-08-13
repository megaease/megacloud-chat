import { getArtifactById, updateArtifact } from "@/server/db/queries/artifacts";
import { type UIMessageStreamWriter, tool } from "ai";
import { z } from "zod";

export const updateDocumentInputSchema = z.object({
	documentId: z.string().min(1).describe("The ID of the document to update"),
	description: z
		.string()
		.min(1)
		.describe("Description of changes that need to be made"),
	content: z
		.string()
		.min(1)
		.describe("The full new content to replace the document with"),
});

interface UpdateDocumentProps {
	userId: string;
	dataStream: UIMessageStreamWriter;
}

export const updateDocumentTool = ({
	userId,
	dataStream,
}: UpdateDocumentProps) =>
	tool({
		description:
			"Update an existing document's content when the user asks to modify previously created content. Do NOT use for questions, time/weather queries, or searches — use specialized tools instead.",
		inputSchema: updateDocumentInputSchema,
		execute: async ({ documentId, description, content }) => {
			if (!userId) {
				throw new Error("Missing userId for document update");
			}

			// Check if document exists and user has permission
			const document = await getArtifactById(documentId, userId);
			if (!document) {
				return {
					success: false,
					action: "update-document",
					documentId,
					error: "Document not found",
				} as const;
			}

			if (document.userId !== userId) {
				return {
					success: false,
					action: "update-document",
					documentId,
					error: "Permission denied",
				} as const;
			}

			// Stream update metadata
			dataStream.write({
				type: "data-id",
				data: documentId,
			});

			dataStream.write({
				type: "data-clear",
				data: null,
			});

			// Stream new content
			dataStream.write({
				type: "data-content",
				data: content,
			});

			// Update in database
			const updated = await updateArtifact({
				artifactId: documentId,
				userId,
				content,
				changeDescription: description,
			});

			dataStream.write({
				type: "data-finish",
				data: null,
			});

			return {
				success: true,
				action: "update-document",
				documentId,
				version: updated?.version,
				title: document.title,
				kind: document.kind,
				content: "The document has been updated successfully.",
			} as const;
		},
	});

export type UpdateDocumentParams = z.infer<typeof updateDocumentInputSchema>;
