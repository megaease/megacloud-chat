import "server-only";
import { db } from "..";
import { chatMessages } from "../schema";
import { nanoid } from "nanoid";
import type { UIMessage } from "ai";

function convertToDBMessages(messages: UIMessage[], chatId: string) {
	return messages.map((message) => {
		const messageId = message.id || nanoid(16);
		return {
			id: messageId,
			createdAt: new Date(),
			chatId: chatId,
			content: message.content,
			parts: message.parts || null,
			role: message.role,
			attachments: message.experimental_attachments || [],
		};
	});
}

export async function saveMessages(chatId: string, messages: UIMessage[]) {
	if (!messages || messages.length === 0) {
		throw new Error("Messages are required");
	}

	if (!chatId) {
		throw new Error("Chat ID is required");
	}

	const dbMessages = convertToDBMessages(messages, chatId);

	try {
		return await db.insert(chatMessages).values(dbMessages).returning();
	} catch (error) {
		console.error("Error saving messages:", error);

		// If it's a duplicate key error, try with new IDs
		if (error instanceof Error && error.message.includes('duplicate key')) {
			console.log("Duplicate key detected, retrying with new IDs...");

			// Generate new IDs for all messages
			const retryMessages = dbMessages.map(msg => ({
				...msg,
				id: nanoid(16), // Force new ID
			}));

			try {
				return await db.insert(chatMessages).values(retryMessages).returning();
			} catch (retryError) {
				console.error("Retry also failed:", retryError);
				throw new Error("Failed to save messages after retry");
			}
		}

		throw new Error("Failed to save messages");
	}
}
