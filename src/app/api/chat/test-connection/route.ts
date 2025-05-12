import { createOpenAI } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		const { apiKey, modelName, baseUrl } = await req.json();

		if (!apiKey || !modelName) {
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

		// Check if the specified model exists in the API's available models
		const modelsData = await modelsResponse.json();
		const availableModels =
			modelsData.data?.map((m: { id: string }) => m.id) || [];
		const modelExists = availableModels.some((id: string) => id === modelName);

		// If everything checks out, return success
		return NextResponse.json(
			{
				success: true,
				message: modelExists
					? "Connection successful - API key and model are valid"
					: "Connection successful - API key is valid, but model may not be available",
				warning: !modelExists
					? `Note: Model "${modelName}" was not found in the available models list. It may still work, but consider using one of the available models instead.`
					: undefined,
				availableModels: availableModels.slice(0, 10), // Return up to 10 available models
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Test connection error:", error);

		// Handle different types of errors
		let message = "Unknown error occurred";
		let statusCode = 500;

		if (error instanceof Error) {
			message = error.message;

			// Determine error type based on message content
			if (
				message.includes("API key") ||
				message.includes("auth") ||
				message.includes("401")
			) {
				message = "Invalid API key or authentication error";
				statusCode = 401;
			} else if (
				message.includes("ENOTFOUND") ||
				message.includes("ECONNREFUSED")
			) {
				message = "Could not connect to API server. Please check the URL";
				statusCode = 503;
			} else if (message.includes("model") || message.includes("not found")) {
				message = "Model not found or unavailable";
				statusCode = 404;
			} else if (
				message.includes("insufficient_quota") ||
				message.includes("billing")
			) {
				message = "Account has insufficient quota or billing issues";
				statusCode = 402;
			} else if (message.includes("rate limit") || message.includes("429")) {
				message = "Rate limit exceeded. Please try again later";
				statusCode = 429;
			}
		}

		return NextResponse.json({ error: message }, { status: statusCode });
	}
}
