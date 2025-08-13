import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { generateId } from "ai";
import { createArtifact } from "@/server/db/queries/artifacts";

export const createDocumentInputSchema = z.object({
	kind: z
		.enum(["text", "code", "sheet", "image"])
		.describe(
			"The artifact/document type. Use 'sheet' for any tabular/CSV/row-column data.",
		),
	language: z
		.string()
		.default("markdown")
		.describe("Language or format hint (e.g., markdown, typescript)"),
	title: z
		.string()
		.min(1)
		.describe("Title for the document"),
	content: z.string().min(1).describe("Initial content of the new document"),
});

interface CreateDocumentProps {
	session: { user: { id: string } };
	dataStream: UIMessageStreamWriter;
}

export const createDocument = ({ session, dataStream }: CreateDocumentProps) =>
	tool({
		description:
			"Create a new artifact/document with substantial content ONLY when the user explicitly requests to create content (code/html/text/sheet/image). Do NOT use for general Q&A, explanations, or tasks like checking time/weather/searching — use appropriate tools instead.",
		inputSchema: createDocumentInputSchema,
		execute: async ({ kind, language, title, content }, { experimental_context }) => {
			if (!session?.user?.id) {
				throw new Error("Missing user session for artifact creation");
			}

			// Get chatId from context
			const ctx = (experimental_context || {}) as { chatId?: string };
			if (!ctx.chatId) {
				throw new Error("Missing chatId in experimental_context");
			}

			const id = generateId();

			// Stream document metadata to UI
			dataStream.write({
				type: "data-id",
				data: id,
			});

			dataStream.write({
				type: "data-kind",
				data: kind,
			});

			dataStream.write({
				type: "data-title",
				data: title,
			});

			dataStream.write({
				type: "data-language",
				data: language,
			});

			dataStream.write({
				type: "data-clear",
				data: null,
			});

			// Stream content progressively
			dataStream.write({
				type: "data-content",
				data: content,
			});

			// Save to database
			const created = await createArtifact({
				id,
				title,
				content,
				kind,
				language,
				userId: session.user.id,
				chatId: ctx.chatId,
				tags: [],
				isPublic: false,
			});

			dataStream.write({
				type: "data-finish",
				data: null,
			});

			return {
				success: true,
				action: "create-document",
				id: created.id,
				version: created.version,
				kind,
				language,
				title: created.title,
				content: "A document was created and is now visible to the user.",
			} as const;
		},
	});

export type CreateDocumentParams = z.infer<typeof createDocumentInputSchema>;
