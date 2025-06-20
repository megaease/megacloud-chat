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
	createDataStream,
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
import { systemPrompt } from "@/lib/prompt";
import { createDocumentTool } from "@/lib/ai/tools/create-document";
import { updateDocumentTool } from "@/lib/ai/tools/update-document";
import {
	createResumableStreamContext,
	type ResumableStreamContext,
} from "resumable-stream";
import { after } from "next/server";

export const maxDuration = 30;

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
	if (!globalStreamContext) {
		try {
			globalStreamContext = createResumableStreamContext({
				waitUntil: after,
			});
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			if (errorMessage.includes("REDIS_URL")) {
				console.log(
					" > Resumable streams are disabled due to missing REDIS_URL",
				);
			} else {
				console.error(error);
			}
		}
	}

	return globalStreamContext;
}
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
			tools: mcpTools,
			clients: mcpClients,
			closeAllMcpClients,
		} = await loadMCPTools(mcpEnabled);
		console.log(mcpEnabled, mcpTools, "allTools");

		console.log(
			`Using ${detectedProvider} model: ${modelName || "gpt-4-turbo"}`,
		);
		const streamId = nanoid(16);

		// Create a new stream ID in the database
		// await createStreamId({ streamId, chatId: id });

		const stream = createDataStream({
			execute: (dataStream) => {
				const result = streamText({
					model: modelConfig,
					system: systemPrompt,
					messages: messages,
					tools: {
						...mcpTools,
						createDocument: createDocumentTool(dataStream, userId, chatId),
						updateDocument: updateDocumentTool(dataStream, userId),
					} as ToolSet,

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
					onError: async (error) => {
						console.error("Stream error:", error);
						await closeAllMcpClients();
					},
				});

				result.consumeStream();
				result.mergeIntoDataStream(dataStream, {
					sendReasoning: true,
				});
			},
		});

		const streamContext = getStreamContext(); // not achieved

		if (streamContext) {
			return new Response(
				await streamContext.resumableStream(streamId, () => stream),
			);
		}
		return new Response(stream);
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
