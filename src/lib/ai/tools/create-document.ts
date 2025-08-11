import { tool } from "ai";
import { z } from "zod";
import {
	createArtifact,
	getChatArtifact,
	updateArtifact,
	getOrCreateChatDocumentId,
} from "@/server/db/queries/artifacts";

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
	content: z.string().min(1).describe("Initial content of the new document"),
	title: z
		.string()
		.optional()
		.describe("Optional human-friendly title for the document"),
});

export const createDocumentTool = tool({
	description:
		"Create a new artifact/document with substantial content ONLY when the user explicitly requests to create content (code/html/text/sheet/image). Do NOT use for general Q&A, explanations, or tasks like checking time/weather/searching — use appropriate tools instead.",
	inputSchema: createDocumentInputSchema,
	execute: async (
		{ kind, language, content, title },
		{ experimental_context },
	) => {
		// Expecting context from API route
		const ctx = (experimental_context || {}) as {
			userId?: string;
			chatId?: string;
		};
		if (!ctx.userId || !ctx.chatId) {
			// Fail softly but inform the model/UI
			return {
				success: false,
				action: "create-document",
				error: "Missing userId/chatId context for persistence.",
				kind,
				language,
				title: title ?? null,
				preview: content.slice(0, 500),
				contentLength: content.length,
			} as const;
		}

		// One Document Per Chat policy: if exists -> create a new version; else create artifact v1
		const existing = await getChatArtifact(ctx.chatId, ctx.userId);
		if (existing) {
			const updated = await updateArtifact({
				artifactId: existing.id,
				userId: ctx.userId,
				content,
				title: title ?? existing.title,
				kind,
				language,
				changeDescription: "createDocument invoked: new version created",
			});

			return {
				success: true,
				action: "create-document",
				id: existing.id,
				version: updated?.version ?? existing.version + 1,
				kind,
				language,
				title: title ?? existing.title,
				preview: content.slice(0, 500),
				contentLength: content.length,
			} as const;
		}

		// No existing document: create v1 with a stable chat-scoped id
		const stableId = await getOrCreateChatDocumentId(ctx.chatId, ctx.userId);
		const created = await createArtifact({
			id: stableId,
			title: title ?? "Untitled",
			content,
			kind,
			language,
			userId: ctx.userId,
			chatId: ctx.chatId,
			tags: [],
			isPublic: false,
		});

		return {
			success: true,
			action: "create-document",
			id: created.id,
			version: created.version,
			kind,
			language,
			title: created.title,
			preview: content.slice(0, 500),
			contentLength: content.length,
		} as const;
	},
});

export type CreateDocumentParams = z.infer<typeof createDocumentInputSchema>;
