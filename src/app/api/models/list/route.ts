import { NextResponse } from "next/server";
import { isOpenAI } from "@/lib/ai-providers";

export async function POST(req: Request) {
	try {
		const { apiKey, baseUrl } = await req.json();

		if (!apiKey || !baseUrl) {
			return NextResponse.json(
				{ error: "API key and base URL are required" },
				{ status: 400 },
			);
		}

		const formattedBaseUrl = baseUrl?.endsWith("/")
			? baseUrl.slice(0, -1)
			: baseUrl || "https://api.openai.com/v1";

		// Fetch model list
		console.log(
			`Fetching model list from ${formattedBaseUrl}/models using key ${apiKey.substring(0, 4)}***`,
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

		// Parse model data
		const modelsData = await modelsResponse.json();
		const availableModels =
			modelsData.data?.map((m: { id: string }) => m.id) || [];

		// Sort and filter models based on different API providers
		let sortedModels = availableModels;
		const isOpenAIProvider = isOpenAI(formattedBaseUrl);

		if (isOpenAIProvider) {
			// Prioritize GPT-4 and GPT-3.5 models for OpenAI
			sortedModels = availableModels.sort((a: string, b: string) => {
				// GPT-4 models first
				if (a.includes("gpt-4") && !b.includes("gpt-4")) return -1;
				if (!a.includes("gpt-4") && b.includes("gpt-4")) return 1;

				// Then GPT-3.5 models
				if (a.includes("gpt-3.5") && !b.includes("gpt-3.5")) return -1;
				if (!a.includes("gpt-3.5") && b.includes("gpt-3.5")) return 1;

				// Finally alphabetical sorting
				return a.localeCompare(b);
			});
		}

		return NextResponse.json(
			{
				success: true,
				models: sortedModels,
				totalCount: availableModels.length,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error fetching model list:", error);

		let message = "An unknown error occurred";
		if (error instanceof Error) {
			message = error.message;
		}

		return NextResponse.json({ error: message }, { status: 500 });
	}
}
