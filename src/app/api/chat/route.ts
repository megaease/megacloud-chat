import { db } from "@/server/db";
import { saveToChatsTable } from "@/server/db/chats";
import { saveToMessagesTable } from "@/server/db/messages";
import { chatMessages, chats } from "@/server/db/schema";
import { deepseek } from "@ai-sdk/deepseek";
import { appendResponseMessages, streamText } from "ai";
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

	const result = streamText({
		model: deepseek("deepseek-chat"),
		messages,
		onError: (error) => {
			console.error("AI Stream error:", error);
		},
		onFinish: async (result) => {
			const allMessages = appendResponseMessages({
				messages,
				responseMessages: result.response.messages,
			});
			await saveToChatsTable(userId, chatId, allMessages);
			await saveToMessagesTable(chatId, allMessages);
		},
	});
	console.log("currentChatId", chatId);

	return result.toDataStreamResponse({});
}
