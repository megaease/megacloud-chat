import "server-only";
import { db } from "..";
import { chatMessages, messageEditHistory } from "../schema";
import { nanoid } from "nanoid";
import { eq, desc } from "drizzle-orm";
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

/**
 * Update a message by ID with edit history tracking
 * @param messageId - The ID of the message to update
 * @param content - The new content for the message
 * @param editReason - Optional reason for the edit
 * @param userId - The user ID for permission validation (optional for now)
 * @returns The updated message
 */
export async function updateMessage(
	messageId: string,
	content: string,
	editReason?: string,
	userId?: string
) {
	if (!messageId) {
		throw new Error("Message ID is required");
	}

	if (!content || content.trim() === "") {
		throw new Error("Message content is required");
	}

	try {
		// First, check if the message exists
		const existingMessage = await db
			.select()
			.from(chatMessages)
			.where(eq(chatMessages.id, messageId))
			.limit(1);

		if (existingMessage.length === 0) {
			throw new Error("Message not found");
		}

		const currentMessage = existingMessage[0];
		const previousContent = currentMessage.content;

		// Don't update if content is the same
		if (previousContent === content.trim()) {
			return currentMessage;
		}

		// Start a transaction to update message and create edit history
		const result = await db.transaction(async (tx) => {
			// Store original content if this is the first edit
			const originalContent = currentMessage.originalContent || previousContent;
			const newEditCount = (currentMessage.editCount || 0) + 1;

			// Update the message
			const updatedMessages = await tx
				.update(chatMessages)
				.set({
					content: content.trim(),
					updatedAt: new Date(),
					originalContent,
					editCount: newEditCount,
				})
				.where(eq(chatMessages.id, messageId))
				.returning();

			if (updatedMessages.length === 0) {
				throw new Error("Failed to update message");
			}

			// Create edit history record
			await tx.insert(messageEditHistory).values({
				messageId,
				previousContent,
				newContent: content.trim(),
				editReason,
			});

			return updatedMessages[0];
		});

		return result;
	} catch (error) {
		console.error("Error updating message:", error);

		if (error instanceof Error) {
			throw error;
		}

		throw new Error("Failed to update message");
	}
}

/**
 * Get a message by ID
 * @param messageId - The ID of the message to retrieve
 * @returns The message or null if not found
 */
export async function getMessageById(messageId: string) {
	if (!messageId) {
		throw new Error("Message ID is required");
	}

	try {
		const messages = await db
			.select()
			.from(chatMessages)
			.where(eq(chatMessages.id, messageId))
			.limit(1);

		return messages.length > 0 ? messages[0] : null;
	} catch (error) {
		console.error("Error fetching message by ID:", error);
		throw new Error("Failed to fetch message");
	}
}

/**
 * Get edit history for a message
 * @param messageId - The ID of the message
 * @returns Array of edit history records
 */
export async function getMessageEditHistory(messageId: string) {
	if (!messageId) {
		throw new Error("Message ID is required");
	}

	try {
		const history = await db
			.select()
			.from(messageEditHistory)
			.where(eq(messageEditHistory.messageId, messageId))
			.orderBy(desc(messageEditHistory.createdAt));

		return history;
	} catch (error) {
		console.error("Error fetching message edit history:", error);
		throw new Error("Failed to fetch edit history");
	}
}
