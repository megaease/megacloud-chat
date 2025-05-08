import { db } from "@/server/db";
import { chatMessages, chats } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { openai } from "@ai-sdk/openai";
import { generateObject, type Message } from "ai";
import { z } from "zod";
import { deepseek } from "@ai-sdk/deepseek";

export async function saveToChatsTable(
	userId: string,
	chatId: string,
	messages: Message[],
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
		let title = "";
		if (messages.length === 0) {
			title = "New Chat";
		} else if (messages.length === 1) {
			title = messages[0]?.content?.substring(0, 50) || "Untitled Chat";
		} else {
			const { object } = await generateObject({
				model: deepseek("deepseek-chat"),
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

		const [newChat] = await db
			.insert(chats)
			.values({
				id: chatId,
				userId: userId,
				title,
			})
			.returning({ id: chats.id });

		if (newChat) {
			currentChatId = newChat.id;
		} else {
			throw new Error("Failed to create a new chat");
		}
	}
}
