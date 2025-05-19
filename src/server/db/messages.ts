import { eq } from "drizzle-orm";
import { db } from ".";
import { chatMessages, chatMessagesSchema } from "./schema";
import { nanoid } from "nanoid";

function convertToDBMessages(messages: any[], chatId: string) {
	return messages.map((message) => {
		const messageId = message.id || nanoid(16);
		return {
			id: messageId,
			createdAt: new Date(),
			chatId: chatId,
			content: message.content,
			parts: message.parts || null,
			role: message.role,
		};
	});
}

export async function saveToMessagesTable(
	chatId: string,
	messages: {
		id: string;
		role: string;
		content: string;
	}[],
) {
	if (!chatId) {
		throw new Error("Chat ID is required");
	}
	if (!messages || messages.length === 0) {
		throw new Error("Messages are required");
	}

	return await db.transaction(async (tx) => {
		try {
			const existingChat = await tx.query.chatMessages.findFirst({
				where: eq(chatMessages.chatId, chatId),
			});

			if (existingChat) {
				await tx.delete(chatMessages).where(eq(chatMessages.chatId, chatId));
			}
			// Prepare new messages and insert
			const dbMessages = convertToDBMessages(messages, chatId);
			return await tx.insert(chatMessages).values(dbMessages);
		} catch (error) {
			console.error("Error in saveToMessagesTable transaction:", error);
			throw error;
		}
	});
}
