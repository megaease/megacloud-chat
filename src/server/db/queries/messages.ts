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
		throw new Error("Failed to save messages");
	}
}
