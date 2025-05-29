import { db } from "@/server/db";
import { chatMessages, chats } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
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
		console.log("Selected chat:", selectedChat);
		return selectedChat;
	} catch (error) {
		console.error("Error fetching chat by ID:", error);
		throw new Error("Failed to fetch chat");
	}
}
