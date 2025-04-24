import { db } from "@/server/db";
import { chatMessages, chats } from "@/server/db/schema";
import { deepseek } from "@ai-sdk/deepseek";
import { streamText } from "ai";
import { eq } from "drizzle-orm";

export const maxDuration = 30;

export async function POST(req: Request) {
	console.log("POST /api/chat");
	const { messages, userId, chatId } = await req.json();
	console.log("messages", userId, chatId);

	if (!messages) {
		return new Response("Invalid request", { status: 400 });
	}
	if (!userId) {
		return Response.json({ error: "User ID is required" }, { status: 400 });
	}
	// 创建 AI 流式响应
	const result = streamText({
		model: deepseek("deepseek-chat"),
		messages,
		onError: (error) => {
			console.error("AI Stream error:", error);
		},
	});

	let currentChatId = chatId;
	console.log("currentChatId", chatId);
	if (currentChatId) {
		const existingChat = await db.query.chats.findFirst({
			where: eq(chats.id, currentChatId),
		});

		if (existingChat) {
			console.log("existingChat", existingChat);
			await db
				.update(chats)
				.set({ updatedAt: new Date() })
				.where(eq(chats.id, currentChatId));
		} else {
			currentChatId = null;
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

	return result.toDataStreamResponse({});
}
