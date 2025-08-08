import {
	generateTitle,
	getChatById,
	saveToChatsTable,
} from "@/server/db/queries/chats";
import { saveMessages } from "@/server/db/queries/messages";
import {
	convertToModelMessages,
	smoothStream,
	streamText,
	createUIMessageStream,
	JsonToSseTransformStream,
	type ToolSet,
	type UIMessage,
	type LanguageModel,
} from "ai";
import { loadMCPTools, type MCPClient } from "@/lib/mcp-utils";
import { nanoid } from "nanoid";
import { detectAndCreateAIModel } from "@/lib/ai-providers";
import { getChatMessageById } from "@/server/db/queries/chat";
import { getTrailingMessageId } from "@/lib/utils";
import { systemPrompt } from "@/lib/prompt";
import { createDocumentTool } from "@/lib/ai/tools/create-document";
import { updateDocumentTool } from "@/lib/ai/tools/update-document";
import { stepCountIs } from "ai";

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
	console.log("Request body:", JSON.stringify(json, null, 2));
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

	console.log("Extracted fields:", { userId, chatId, modelName, providerType });

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
			const title = await generateTitle(
				chatId,
				[message],
				modelConfig as LanguageModel,
			);

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

		// Manually append the new message to existing messages (AI SDK 5 pattern)
		const allMessages = [...(existingChatMessages || []), message];
		await saveMessages(chatId, [message]);

		// Convert to core messages for the AI model
		// Filter and convert existing DB messages to UIMessage format
		const uiMessages: UIMessage[] = allMessages.map((msg) => {
			if ("parts" in msg && Array.isArray(msg.parts)) {
				// This is already a UIMessage
				return msg as UIMessage;
			}
			// This is a DB message, convert it
			const dbMsg = msg as { id: string; role: string; content: string };
			return {
				id: dbMsg.id,
				role: dbMsg.role,
				parts: [{ type: "text" as const, text: dbMsg.content }],
			} as UIMessage;
		});

		const coreMessages = convertToModelMessages(uiMessages);

		// Heuristic: if the latest user message strongly implies creating a document,
		// nudge the model to pick the createDocument tool first to validate the tool chain.
		const lastUser = uiMessages
			.slice()
			.reverse()
			.find((m) => m.role === "user");
		type Part = { type?: string; text?: string };
		const userParts = (lastUser?.parts ?? []) as Part[];
		const lastText = userParts
			.filter((p) => p?.type === "text" && typeof p.text === "string")
			.map((p) => p.text as string)
			.join("\n");
		const forceCreateDoc =
			/create\s+document|create\s+doc|新建文档|创建文档|生成文档|生成笔记|写.*文档/i.test(
				lastText,
			);

		// Load MCP tools using the extracted utility function
		// Load MCP tools with a safe fallback so chat continues even if MCP fails
		let mcpTools: ToolSet | undefined = undefined;
		try {
			const { tools } = await loadMCPTools(mcpEnabled);
			mcpTools = tools;
		} catch (e) {
			console.warn("MCP tools load failed, continuing without tools:", e);
		}
		console.log(
			"MCP enabled:",
			mcpEnabled,
			"Loaded tools:",
			Object.keys(mcpTools ?? {}),
		);

		console.log(
			`Using ${detectedProvider} model: ${modelName || "gpt-4-turbo"}`,
		);
		const streamId = nanoid(16);

		// Local tool set that's always available (even when MCP is disabled)
		const localTools: ToolSet = {
			createDocument: createDocumentTool,
			updateDocument: updateDocumentTool,
		};

		// Create a UI message stream for better handling
		const stream = createUIMessageStream({
			execute: ({ writer: dataStream }) => {
				const baseOpts = {
					model: modelConfig as LanguageModel,
					system: systemPrompt,
					messages: coreMessages,
					tools: { ...(localTools as ToolSet), ...(mcpTools ?? {}) } as ToolSet,
					// Enable multi-step loop so that tool calls are executed and the
					// model can produce a follow-up answer considering tool results.
					stopWhen: stepCountIs(5),
					experimental_context: { userId, chatId },
					experimental_transform: smoothStream({ chunking: "word" }),
					providerOptions: {
						openai: {
							reasoningEffort: "low",
							reasoningSummary: "detailed",
						},
					},
					experimental_telemetry: {
						isEnabled: process.env.NODE_ENV === "production",
						functionId: "stream-text",
					},
				};

				// Prefer the createDocument tool when strongly hinted by the user.
				const result = streamText(
					forceCreateDoc
						? {
								...baseOpts,
								toolChoice: { type: "tool", toolName: "createDocument" },
							}
						: baseOpts,
				);

				result.consumeStream();

				dataStream.merge(
					result.toUIMessageStream({
						sendReasoning: true,
					}),
				);
			},
			generateId: () => nanoid(),
			onFinish: async ({ messages }) => {
				// Save all new messages from the stream
				const messagesToSave = messages
					.filter((msg) => msg.role === "assistant")
					.map(
						(message) =>
							({
								id: message.id,
								role: message.role,
								parts: message.parts,
								chatId: chatId,
							}) as UIMessage,
					);

				if (messagesToSave.length > 0) {
					await saveMessages(chatId, messagesToSave);
				}
			},
			onError: (error) => {
				console.error("Stream error:", error);
				return "Oops, an error occurred while processing your request!";
			},
		});

		return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
	} catch (error) {
		console.error("Chat API error:", error);
		return Response.json({ error: "Internal server error" }, { status: 500 });
	}
}
