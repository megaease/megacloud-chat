import { db } from "@/server/db";
import { chats } from "@/server/db/schema";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { detectAndCreateAIModel } from "@/lib/ai-providers";
import { generateTitle } from "@/server/db/queries/chats";
import type { UIMessage, LanguageModel } from "ai";

export async function POST(request: Request) {
	try {
		const {
			userId,
			title = "New Chat",
			message,
			modelName,
			apiKey,
			baseUrl,
			providerType,
		} = await request.json();

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 },
			);
		}

		// Generate a new chat ID
		const chatId = nanoid(16);

		let finalTitle = title;

		// If message is provided, generate a smart title based on the message content
		if (message && modelName) {
			try {
				// Create a UI message from the input
				const uiMessage: UIMessage = {
					id: nanoid(),
					role: "user",
					parts: [
						{
							type: "text",
							text: typeof message === "string" ? message : message.text || "",
						},
					],
				};

				// Get model configuration for title generation
				const { model: modelConfig } = detectAndCreateAIModel({
					apiKey,
					modelName,
					baseUrl,
					providerType,
				});

				// Generate title based on the message
				const generatedTitle = await generateTitle(
					chatId,
					[uiMessage],
					modelConfig as LanguageModel,
				);

				if (generatedTitle?.trim()) {
					finalTitle = generatedTitle;
				}
			} catch (error) {
				console.warn("Failed to generate title, using default:", error);
				// Fall back to simple title generation
				if (typeof message === "string" && message.trim()) {
					finalTitle =
						message.trim().substring(0, 50) +
						(message.length > 50 ? "..." : "");
				} else if (message?.text) {
					finalTitle =
						message.text.trim().substring(0, 50) +
						(message.text.length > 50 ? "..." : "");
				}
			}
		}

		// Create the chat record
		const [newChat] = await db
			.insert(chats)
			.values({
				id: chatId,
				userId: userId,
				title: finalTitle,
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
