import { db } from "@/server/db";
import { chats } from "@/server/db/schema";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { userId, title = "New Chat" } = await request.json();

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 },
			);
		}

		// Generate a new chat ID
		const chatId = nanoid(16);

		// Create the chat record
		const [newChat] = await db
			.insert(chats)
			.values({
				id: chatId,
				userId: userId,
				title: title,
			})
			.returning({ id: chats.id, title: chats.title });

		return NextResponse.json({
			chat: newChat,
			success: true,
		});
	} catch (error) {
		console.error("Error creating chat:", error);
		return NextResponse.json(
			{ error: "Failed to create chat" },
			{ status: 500 },
		);
	}
}
