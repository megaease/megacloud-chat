import "server-only";
import { db } from "@/server/db";
import { chatMessages } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

export async function getChatMessageById(userId: string, chatId: string) {
	try {
		return await db
			.select()
			.from(chatMessages)
			.where(and(eq(chatMessages.chatId, chatId)))
			.orderBy(chatMessages.createdAt);
	} catch (error) {
		console.error("Error fetching chat by ID:", error);
		throw new Error("Failed to fetch chat");
	}
}
