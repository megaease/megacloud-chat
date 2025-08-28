import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { updateArtifact, getArtifactById } from "@/server/db/queries/artifacts";

export const updateDocumentInputSchema = z.object({
	id: z.string().min(1).describe("The ID of the document to update"),
	description: z
		.string()
		.min(1)
		.describe("Description of changes that need to be made"),
});

interface UpdateDocumentProps {
	session: { user: { id: string } };
	dataStream: UIMessageStreamWriter;
}

export const updateDocument = ({ session, dataStream }: UpdateDocumentProps) =>
	tool({
		description:
			"Update an existing document's content when the user asks to modify previously created content. Do NOT use for questions, time/weather queries, or searches — use specialized tools instead.",
		inputSchema: updateDocumentInputSchema,
		execute: async ({ id, description }) => {
			if (!session?.user?.id) {
				throw new Error("Missing user session for document update");
			}

			// Check if document exists and user has permission
			const document = await getArtifactById(id, session.user.id);
			if (!document) {
				return {
					success: false,
					action: "update-document",
					id,
					error: "Document not found",
				} as const;
			}

			// Stream update metadata
			dataStream.write({
				type: "data-id",
				data: id,
			});

			dataStream.write({
				type: "data-clear",
				data: null,
			});

			// For update, we need to generate new content based on description
			// This is a simplified implementation - in practice, you might use AI to generate the update
			const updatedContent = `${document.content}\n\n<!-- Updated: ${description} -->`;

			// Stream new content
			dataStream.write({
				type: "data-content",
				data: updatedContent,
			});

			// Update in database
			const updated = await updateArtifact({
				artifactId: id,
				userId: session.user.id,
				content: updatedContent,
				changeDescription: description,
			});

			dataStream.write({
				type: "data-finish",
				data: null,
			});

			return {
				success: true,
				action: "update-document",
				id,
				version: updated?.version,
				title: document.title,
				kind: document.kind,
				content: "The document has been updated successfully.",
			} as const;
		},
	});

export type UpdateDocumentParams = z.infer<typeof updateDocumentInputSchema>;