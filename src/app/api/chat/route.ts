import { saveToChatsTable } from "@/server/db/chats";
import { saveToMessagesTable } from "@/server/db/messages";
import { openai } from "@ai-sdk/openai";
import { createOpenAI } from "@ai-sdk/openai";
import { appendResponseMessages, streamText, type ToolSet } from "ai";
import { loadMCPTools, type MCPClient } from "@/lib/mcp-utils";
import { createDeepSeek } from "@ai-sdk/deepseek";

export const maxDuration = 30;

function isOpenai(url: string) {
	if (url.includes("openai") || url.includes("api.openai")) {
		return true;
	}
	return false;
}

export async function POST(req: Request) {
	console.log("POST /api/chat");
	const { messages, userId, chatId, apiKey, modelName, baseUrl, mcpEnabled } =
		await req.json();

	if (!messages) {
		return new Response("Invalid request", { status: 400 });
	}
	if (!userId) {
		return Response.json({ error: "User ID is required" }, { status: 400 });
	}

	try {
		// Load MCP tools using the extracted utility function
		const {
			tools: allTools,
			clients: mcpClients,
			closeAllMcpClients,
		} = await loadMCPTools(mcpEnabled);

		// Set up the AI model based on user configuration
		let modelConfig = openai("gpt-4-turbo", {
			structuredOutputs: true,
		});

		// Check if user provided API key and model name
		if (apiKey && modelName) {
			try {
				console.log(
					`Using custom model: ${modelName} with custom API configuration`,
				);

				// Create OpenAI compatible client with user settings
				const compatibleAI = createOpenAI({
					baseURL: baseUrl || "https://api.openai.com/v1",
					apiKey: apiKey,
					compatibility: isOpenai(baseUrl) ? "strict" : "compatible",
				});

				// Use the user-specified model
				modelConfig = compatibleAI(modelName);
			} catch (error) {
				console.error("Error configuring custom model:", error);
				throw new Error(
					`Failed to initialize model "${modelName}": ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		}
		const deepseek = createDeepSeek({
			apiKey: apiKey,
		});
		console.log(mcpEnabled, allTools, "allTools");
		const result = streamText({
			model: deepseek(modelName),
			system: `You are a helpful AI assistant with access to various tools through the Model Control Protocol (MCP). 
				TOOLS:
				You can use mcp tools to perform specific tasks. Each tool has a name, description, and parameters. You can call these tools by their names and provide the required parameters.
				GUIDELINES FOR TOOL USAGE:
				- Use tools only when necessary to provide accurate and helpful responses.
				- When you need information you don't have, use the appropriate tool rather than guessing.
				- Always explain to the user when you're using a tool and why.
				- After receiving results from a tool, interpret them clearly for the user.
				- If a tool fails, gracefully explain the issue and suggest alternatives.
				RESPONSE FORMAT:
				- Be concise and direct in your responses.
				- Format code, data, and lists appropriately for readability.
				- When showing tool results, clearly distinguish them from your own commentary.

				Remember that your primary goal is to be helpful, accurate, and transparent about your capabilities and limitations.`,

			messages,
			tools: allTools,
			providerOptions: {
				openai: {
					reasoningEffort: "low",
					reasoningSummary: "detailed",
				},
			},
			onFinish: async (result) => {
				const allMessages = appendResponseMessages({
					messages,
					responseMessages: result.response.messages,
				});
				await saveToChatsTable(userId, chatId, allMessages);
				await saveToMessagesTable(chatId, allMessages);

				// Close all connections after request completes
				await closeAllMcpClients();
			},
			onError: async (error) => {
				// Close all connections on error
				console.error("AI Stream error:", JSON.stringify(error));
				await closeAllMcpClients();
			},
		});

		return result.toDataStreamResponse({
			sendReasoning: true,
			getErrorMessage: (error) => {
				console.error("Error in stream:", JSON.stringify(error));
				return error instanceof Error ? error.message : "An error occurred";
			},
		});
	} catch (error) {
		console.error("Error processing request:", JSON.stringify(error));
	}
}
