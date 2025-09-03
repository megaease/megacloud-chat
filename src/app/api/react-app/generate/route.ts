// app/api/react-app/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createReactApp } from "@/lib/services/react-app-service";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { title, userId, chatId, customComponent, autoStart } = body;

		if (!title || !userId || !chatId) {
			return NextResponse.json(
				{ error: "Title, userId, and chatId are required" },
				{ status: 400 }
			);
		}

		const result = await createReactApp({
			title,
			userId,
			chatId,
			customComponent,
			autoStart: autoStart ?? true,
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("React app generation API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}