import { db } from "@/server/db";
import { chats } from "@/server/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const userId = request.headers.get("userId");

		if (!userId) {
			return NextResponse.json(
				{ error: "userId is required" },
				{ status: 400 },
			);
		}

		// Get limit from query parameters (default to 50, max 100)
		const { searchParams } = new URL(request.url);
		const limitParam = searchParams.get("limit");
		const limit = limitParam
			? Math.min(Number.parseInt(limitParam, 10), 100)
			: 50;

		const userChats = await db.query.chats.findMany({
			where: (chats, { eq }) => eq(chats.userId, userId),
			orderBy: [desc(chats.updatedAt)],
			limit: limit,
		});

		return NextResponse.json({
			chats: userChats,
			total: userChats.length,
			limit: limit,
		});
	} catch (error) {
		console.error("Failed to get chat records:", error);
		return NextResponse.json(
			{ error: "Error retrieving chat records" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const userId = request.headers.get("userId");

		if (!userId) {
			return NextResponse.json(
				{ error: "userId is required" },
				{ status: 400 },
			);
		}

		const { chatId } = await request.json();

		if (!chatId) {
			return NextResponse.json(
				{ error: "chatId is required" },
				{ status: 400 },
			);
		}

		// Ensure users can only delete their own chats
		const result = await db
			.delete(chats)
			.where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
			.returning({ id: chats.id });

		if (result.length === 0) {
			return NextResponse.json(
				{
					error: "Chat doesn't exist or you don't have permission to delete it",
				},
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete chat:", error);
		return NextResponse.json({ error: "Error deleting chat" }, { status: 500 });
	}
}
