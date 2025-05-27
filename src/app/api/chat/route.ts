import { saveToChatsTable } from "@/server/db/chats";
import { saveToMessagesTable } from "@/server/db/messages";
import {
	appendResponseMessages,
	smoothStream,
	streamText,
	type ToolSet,
} from "ai";
import { loadMCPTools, type MCPClient } from "@/lib/mcp-utils";
import { nanoid } from "nanoid";
import { detectAndCreateAIModel } from "@/lib/ai-providers";

export const maxDuration = 30;

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
		const { model: modelConfig, detectedProvider } = detectAndCreateAIModel({
			apiKey,
			modelName: modelName || "gpt-4-turbo",
			baseUrl,
		});
		console.log(modelConfig, "modelConfig");
		// create a new chat in the database chats table
		await saveToChatsTable(userId, chatId, messages);

		// Load MCP tools using the extracted utility function
		const {
			tools: allTools,
			clients: mcpClients,
			closeAllMcpClients,
		} = await loadMCPTools(mcpEnabled);
		console.log(mcpEnabled, allTools, "allTools");

		console.log(
			`Using ${detectedProvider} model: ${modelName || "gpt-4-turbo"}`,
		);
		const result = streamText({
			model: modelConfig,
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
				// update the chat in the database
				await saveToChatsTable(userId, chatId, allMessages);
				await saveToMessagesTable(chatId, allMessages);

				// Close all connections after request completes
				await closeAllMcpClients();
			},
			onError: async (response) => {
				console.error(
					"AI Stream error:",
					JSON.stringify(response?.error, null, 2),
				);
				// Handle error gracefully
				const error =
					response?.error &&
					typeof response.error === "object" &&
					"data" in response.error &&
					response.error.data &&
					typeof response.error.data === "object" &&
					"error" in response.error.data
						? (response.error.data as { error?: { message?: string } }).error
						: undefined;
				const errorContent = `Sorry, I encountered an error: ${error?.message || "Unknown error"}. Please try again or rephrase your question.`;
				const errorMessage = {
					id: nanoid(16),
					role: "assistant" as const,
					content: errorContent,
					chatId: chatId,
				};
				// Append error message to the chat
				const allMessages = appendResponseMessages({
					messages,
					responseMessages: [errorMessage],
				});
				// Save the error message to the database
				await saveToMessagesTable(chatId, allMessages);
				// Update the chat in the database
				await saveToChatsTable(userId, chatId, allMessages);
				// Close all connections after error
				await closeAllMcpClients();
			},
		});

		return result.toDataStreamResponse({
			sendReasoning: true,
			getErrorMessage: (error) => {
				return error instanceof Error
					? error.message
					: "An unknown error occurred, please try again later";
			},
		});
	} catch (error) {
		console.error("Error processing request:", JSON.stringify(error));
		// Return a proper error response instead of nothing
		return Response.json(
			{
				error: "Error processing request",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
