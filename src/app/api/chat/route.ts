import {
	generateTitle,
	getChatById,
	saveToChatsTable,
} from "@/server/db/queries/chats";
import { saveMessages } from "@/server/db/queries/messages";
import {
	appendClientMessage,
	appendResponseMessages,
	convertToCoreMessages,
	smoothStream,
	streamText,
	type Message,
	type ToolSet,
	type UIMessage,
} from "ai";
import { loadMCPTools, type MCPClient } from "@/lib/mcp-utils";
import { nanoid } from "nanoid";
import { detectAndCreateAIModel } from "@/lib/ai-providers";
import { getChatMessageById } from "@/server/db/queries/chat";
import { getTrailingMessageId } from "@/lib/utils";

export const maxDuration = 30;

type requestBody = {
	userId: string;
	chatId: string;
	apiKey?: string;
	modelName?: string;
	baseUrl?: string;
	providerType?: string;
	mcpEnabled?: boolean;
	message: UIMessage;
};
export async function POST(req: Request) {
	console.log("POST /api/chat");
	const json = await req.json();
	const requestBody: requestBody = json as requestBody;
	const {
		userId,
		chatId,
		apiKey,
		modelName,
		baseUrl,
		providerType,
		mcpEnabled,
		message,
	} = requestBody;
	if (!userId) {
		return Response.json({ error: "User ID is required" }, { status: 400 });
	}
	if (!chatId) {
		return Response.json({ error: "Chat ID is required" }, { status: 400 });
	}
	if (!modelName) {
		return Response.json({ error: "Model name is required" }, { status: 400 });
	}
	if (!apiKey && !baseUrl && !providerType) {
		return Response.json(
			{ error: "API key, base URL, or provider type is required" },
			{ status: 400 },
		);
	}
	console.log("chatId:", chatId);
	try {
		const { model: modelConfig, detectedProvider } = detectAndCreateAIModel({
			apiKey,
			modelName: modelName || "gpt-4-turbo",
			baseUrl,
			providerType,
		});
		console.log(modelConfig, "modelConfig");

		const chat = await getChatById({ chatId, userId });
		console.log(chat, "chat");
		if (!chat) {
			const title = await generateTitle(chatId, [message], modelConfig);

			await saveToChatsTable({
				userId,
				chatId,
				title,
			});
			console.log("New chat created with title:", title);
		}

		// Fetch existing messages or create a new chat if it doesn't exist
		const existingChatMessages = await getChatMessageById(userId, chatId);
		console.log(existingChatMessages, "existingChatMessages");
		const messages = appendClientMessage({
			// @ts-ignore
			messages: existingChatMessages || [],
			message,
		});
		await saveMessages(chatId, [message]);
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
				- Before using a tool, tell the user what you are going to do and why.
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

			messages: messages,
			tools: allTools,
			experimental_transform: smoothStream({ chunking: "word" }),
			maxSteps: 10,
			providerOptions: {
				openai: {
					reasoningEffort: "low",
					reasoningSummary: "detailed",
				},
			},
			onFinish: async (result) => {
				const responseMessages = result.response.messages;

				const assistantId = getTrailingMessageId({
					messages: responseMessages.filter(
						(message) => message.role === "assistant",
					),
				});
				if (!assistantId) {
					console.error("No assistant message found in response");
					throw new Error("No assistant message found in response");
				}

				const [, lastMessage] = appendResponseMessages({
					messages: [message],
					responseMessages: responseMessages,
				});
				if (!lastMessage) {
					console.error("No last message found in response");
					throw new Error("No last message found in response");
				}
				await saveMessages(chatId, [
					{
						id: assistantId,
						role: lastMessage.role,
						parts: lastMessage.parts ?? [],
						createdAt: new Date(),
						content: lastMessage.content,
						experimental_attachments:
							lastMessage.experimental_attachments ?? [],
					},
				]);

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
