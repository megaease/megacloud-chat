import { db } from "@/server/db";
import { chats, chatMessages } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: { id: string } },
) {
	try {
		const userId = request.headers.get("userId");

		if (!userId) {
			return NextResponse.json(
				{ error: "userId is required" },
				{ status: 400 },
			);
		}

		const { id } = await params;

		if (!id) {
			return NextResponse.json(
				{ error: "Chat ID is required" },
				{ status: 400 },
			);
		}

		const chat = await db.query.chats.findFirst({
			where: and(eq(chats.id, id), eq(chats.userId, userId)),
		});

		if (!chat) {
			return NextResponse.json(
				{ error: "Chat not found or you don't have access to it" },
				{ status: 404 },
			);
		}

		const messages = await db.query.chatMessages.findMany({
			where: eq(chatMessages.chatId, id),
			orderBy: (chatMessages, { asc }) => [asc(chatMessages.createdAt)],
		});

		const chatWithMessages = {
			...chat,
			messages,
		};

		return NextResponse.json({ chat: chatWithMessages });
	} catch (error) {
		console.error("Error fetching chat:", error);
		return NextResponse.json(
			{ error: "Failed to fetch chat" },
			{ status: 500 },
		);
	}
}
