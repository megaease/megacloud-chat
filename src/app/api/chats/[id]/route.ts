import { db } from "@/server/db";
import { updateChatTitle } from "@/server/db/queries/chats";
import { chatMessages, chats } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for chat title update
const updateChatTitleSchema = z.object({
	title: z
		.string()
		.min(1, "Chat title is required")
		.max(100, "Chat title is too long"),
});

interface RouteContext {
	params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteContext) {
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

// PATCH /api/chats/[id] - Update chat title
export async function PATCH(request: Request, { params }: RouteContext) {
	try {
		const { id: chatId } = await params;
		const userId = request.headers.get("userId");

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 },
			);
		}

		if (!chatId) {
			return NextResponse.json(
				{ error: "Chat ID is required" },
				{ status: 400 },
			);
		}

		const body = await request.json();

		// Validate request body
		const validatedData = updateChatTitleSchema.parse(body);
		const { title } = validatedData;

		// Update the chat title
		const updatedChat = await updateChatTitle({
			chatId,
			userId,
			title,
		});

		return NextResponse.json({
			chat: updatedChat,
			success: true,
		});
	} catch (error) {
		console.error("Error updating chat title:", error);

		// Handle validation errors
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: error.errors,
				},
				{ status: 400 },
			);
		}

		// Handle known errors from updateChatTitle function
		if (error instanceof Error) {
			if (
				error.message ===
				"Chat not found or you don't have permission to update it"
			) {
				return NextResponse.json(
					{ error: "Chat not found or you don't have permission to update it" },
					{ status: 404 },
				);
			}

			if (error.message === "Chat title is required") {
				return NextResponse.json(
					{ error: "Chat title is required" },
					{ status: 400 },
				);
			}

			if (error.message === "User ID is required") {
				return NextResponse.json(
					{ error: "User ID is required" },
					{ status: 400 },
				);
			}

			if (error.message === "Chat ID is required") {
				return NextResponse.json(
					{ error: "Chat ID is required" },
					{ status: 400 },
				);
			}
		}

		return NextResponse.json(
			{ error: "Failed to update chat title" },
			{ status: 500 },
		);
	}
}
