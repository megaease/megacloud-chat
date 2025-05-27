import { NextResponse } from "next/server";
import { isOpenAI } from "@/lib/ai-providers";

export async function POST(req: Request) {
	try {
		const { apiKey, modelName, baseUrl } = await req.json();

		if (!apiKey || !baseUrl) {
			return NextResponse.json(
				{ error: "API key and model name are required" },
				{ status: 400 },
			);
		}

		const formattedBaseUrl = baseUrl?.endsWith("/")
			? baseUrl.slice(0, -1)
			: baseUrl || "https://api.openai.com/v1";

		// Test the connection by making a request to the models endpoint
		// This is a lightweight check that doesn't consume tokens
		console.log(
			`Testing connection to ${formattedBaseUrl}/models with key ${apiKey.substring(0, 4)}***`,
		);

		const modelsResponse = await fetch(`${formattedBaseUrl}/models`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
		});

		if (!modelsResponse.ok) {
			const errorData = await modelsResponse.json().catch(() => ({}));
			throw new Error(
				errorData.error?.message ||
					`API returned ${modelsResponse.status}: ${modelsResponse.statusText}`,
			);
		}

		// Parse response to get basic connection info
		await modelsResponse.json();

		// If everything checks out, return success
		return NextResponse.json(
			{
				success: true,
				message: "Connection successful - API key is valid",
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Test connection error:", error);

		// Handle different types of errors
		let message = "Unknown error occurred";

		if (error instanceof Error) {
			message = error.message;
		}
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
