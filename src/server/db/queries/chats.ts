import "server-only";
import { db } from "@/server/db";
import { chatMessages, chats } from "@/server/db/schema";
import { and, eq, or, like, desc, sql } from "drizzle-orm";
import { generateObject, type LanguageModelV1, type Message } from "ai";
import { z } from "zod";
import { deepseek } from "@ai-sdk/deepseek";

export async function generateTitle(
	chatId: string,
	messages: Message[],
	modelConfig: LanguageModelV1,
) {
	console.log("Creating new chat", chatId);
	let title = "";
	if (messages.length === 0) {
		title = "New Chat";
	} else if (messages.length === 1) {
		title = messages[0]?.content?.substring(0, 50) || "Untitled Chat";
	} else {
		const { object } = await generateObject({
			model: modelConfig,
			schema: z.object({
				title: z.string().min(1).max(50),
			}),
			system:
				"Generate a title for a new chat,the title should be concise and relevant to the conversation.",
			messages: messages.map((message) => ({
				role: message.role,
				content: message.content,
			})),
		});
		title = object.title;
	}
	return title;
}

export async function saveToChatsTable({
	userId,
	chatId,
	title,
}: { userId: string; chatId: string; title: string }) {
	try {
		return await db
			.insert(chats)
			.values({
				id: chatId,
				userId: userId,
				title,
			})
			.returning({ id: chats.id });
	} catch (error) {
		console.error("Error saving to chats table:", error);
		throw new Error("Failed to save chat");
	}
}

export async function getChatById({
	chatId,
	userId,
}: {
	chatId: string;
	userId: string;
}) {
	try {
		const [selectedChat] = await db
			.select()
			.from(chats)
			.where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
		return selectedChat;
	} catch (error) {
		console.error("Error fetching chat by ID:", error);
		throw new Error("Failed to fetch chat");
	}
}

export async function updateChatTitle({
	chatId,
	userId,
	title,
}: {
	chatId: string;
	userId: string;
	title: string;
}) {
	if (!chatId) {
		throw new Error("Chat ID is required");
	}

	if (!userId) {
		throw new Error("User ID is required");
	}

	if (!title || title.trim() === "") {
		throw new Error("Chat title is required");
	}

	try {
		// First, check if the chat exists and belongs to the user
		const existingChat = await getChatById({ chatId, userId });
		if (!existingChat) {
			throw new Error("Chat not found or you don't have permission to update it");
		}

		// Update the chat title
		const updatedChats = await db
			.update(chats)
			.set({
				title: title.trim(),
				updatedAt: new Date(),
			})
			.where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
			.returning();

		if (updatedChats.length === 0) {
			throw new Error("Failed to update chat title");
		}

		return updatedChats[0];
	} catch (error) {
		console.error("Error updating chat title:", error);
		throw error;
	}
}

export async function searchChats({
	userId,
	query,
	limit = 20,
}: {
	userId: string;
	query: string;
	limit?: number;
}) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	if (!query || query.trim() === "") {
		throw new Error("Search query is required");
	}

	try {
		// Convert search term to lowercase for case-insensitive search
		const searchTerm = `%${query.trim().toLowerCase()}%`;

		// Search in both chat titles and message contents (case-insensitive using SQL LOWER function)
		const results = await db
			.select({
				chatId: chats.id,
				chatTitle: chats.title,
				chatCreatedAt: chats.createdAt,
				chatUpdatedAt: chats.updatedAt,
				messageId: chatMessages.id,
				messageContent: chatMessages.content,
				messageRole: chatMessages.role,
				messageCreatedAt: chatMessages.createdAt,
			})
			.from(chats)
			.leftJoin(chatMessages, eq(chats.id, chatMessages.chatId))
			.where(
				and(
					eq(chats.userId, userId),
					or(
						sql`LOWER(${chats.title}) LIKE ${searchTerm}`,
						sql`LOWER(${chatMessages.content}) LIKE ${searchTerm}`
					)
				)
			)
			.orderBy(desc(chats.updatedAt), desc(chatMessages.createdAt))
			.limit(limit * 5); // Get more results to account for multiple messages per chat

		// Group results by chat and format them
		const chatMap = new Map();

		for (const result of results) {
			if (!chatMap.has(result.chatId)) {
				chatMap.set(result.chatId, {
					id: result.chatId,
					title: result.chatTitle,
					createdAt: result.chatCreatedAt,
					updatedAt: result.chatUpdatedAt,
					matchedMessages: [],
				});
			}

			// Add matched message if it exists and contains the search term
			if (result.messageId && result.messageContent?.toLowerCase().includes(query.toLowerCase())) {
				const chat = chatMap.get(result.chatId);
				chat.matchedMessages.push({
					id: result.messageId,
					content: result.messageContent,
					role: result.messageRole,
					createdAt: result.messageCreatedAt,
				});
			}
		}

		// Convert map to array and limit results
		const searchResults = Array.from(chatMap.values()).slice(0, limit);

		return searchResults;
	} catch (error) {
		console.error("Error searching chats:", error);
		throw error;
	}
}
