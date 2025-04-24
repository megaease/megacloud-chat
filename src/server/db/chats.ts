import { db } from "@/server/db";
import { chatMessages, chats } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

export async function saveToChatsTable(
	userId: string,
	chatId: string,
	messages: any[],
) {
	let currentChatId = chatId;
	if (currentChatId) {
		const existingChat = await db.query.chats.findFirst({
			where: and(eq(chats.id, currentChatId), eq(chats.userId, userId)),
		});

		if (existingChat) {
			console.log("existingChat", existingChat);
			await db
				.update(chats)
				.set({ updatedAt: new Date() })
				.where(and(eq(chats.id, currentChatId), eq(chats.userId, userId)));
		} else {
			currentChatId = "";
		}
	}

	if (!currentChatId) {
		console.log("Creating new chat", chatId);
		const [newChat] = await db
			.insert(chats)
			.values({
				id: chatId,
				userId: userId,
				title: messages[0]?.content?.substring(0, 50) || "新对话",
			})
			.returning({ id: chats.id });

		if (newChat) {
			currentChatId = newChat.id;
		} else {
			throw new Error("Failed to create a new chat");
		}
	}
}
