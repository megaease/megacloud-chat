import { detectAndCreateAIModel } from "@/lib/ai-providers";
import { createArtifactTool } from "@/lib/ai/tools/create-artifact-tool";
import { updateArtifactTool } from "@/lib/ai/tools/update-artifact-tool";
import { loadMCPTools } from "@/lib/mcp-utils";
import { systemPrompt } from "@/lib/prompt";
import { getChatMessageById } from "@/server/db/queries/chat";
import {
	generateTitle,
	getChatById,
	saveToChatsTable,
	updateChatTitle,
} from "@/server/db/queries/chats";
import { saveMessages } from "@/server/db/queries/messages";
import {
	JsonToSseTransformStream,
	type LanguageModel,
	type ToolSet,
	type UIMessage,
	convertToModelMessages,
	createUIMessageStream,
	smoothStream,
	streamText,
} from "ai";
import { stepCountIs } from "ai";
import { nanoid } from "nanoid";

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
			// Ensure chat row exists immediately to satisfy FK on messages
			await saveToChatsTable({ userId, chatId, title: "New Chat" });
			// Generate a better title in background and update the chat
			Promise.resolve()
				.then(async () => {
					const title = await generateTitle(
						chatId,
						[message],
						modelConfig as LanguageModel,
					);
					if (title?.trim()) {
						await updateChatTitle({ userId, chatId, title });
						console.log("Chat title updated:", title);
					}
				})
				.catch((err) =>
					console.warn("Background title generation failed:", err),
				);
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

		// Sanitize history: remove tool-related parts that the model conversion cannot accept
		const sanitizedUiMessages: UIMessage[] = uiMessages
			.map((msg) => {
				const parts = (msg as { parts?: Array<unknown> }).parts;
				if (!Array.isArray(parts)) return msg;
				const filtered = parts.filter((p: any) => {
					if (typeof p === "string") return true; // keep plain text
					const t = p?.type as string | undefined;
					if (!t) return true;
					const isToolLike =
						t === "tool" ||
						t === "tool-invocation" ||
						t === "tool-call" ||
						t === "tool-result" ||
						t === "step-start" ||
						t === "reasoning" ||
						(t?.startsWith("tool-") ?? false);
					return !isToolLike;
				});
				return { ...(msg as UIMessage), parts: filtered } as UIMessage;
			})
			// drop messages that end up with no parts
			.filter(
				(m) => Array.isArray((m as any).parts) && (m as any).parts.length > 0,
			);

		const coreMessages = convertToModelMessages(sanitizedUiMessages);

		// Load MCP tools with opt-in and timeout so requests never hang
		let mcpTools: ToolSet | undefined = undefined;
		if (mcpEnabled) {
			try {
				console.time("mcpToolsLoad");
				const mcpLoad = loadMCPTools(true);
				const timeout = new Promise<{ tools?: ToolSet }>((resolve) =>
					setTimeout(() => resolve({ tools: undefined }), 5000),
				);
				const { tools } = await Promise.race([
					mcpLoad as unknown as Promise<{ tools?: ToolSet }>,
					timeout,
				]);
				mcpTools = tools;
				console.timeEnd("mcpToolsLoad");
			} catch (e) {
				console.warn(
					"MCP tools load failed or timed out, continuing without tools:",
					e,
				);
			}
		} else {
			console.log("MCP disabled; skipping MCP tool loading");
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
		// const streamId = nanoid(16); // no longer used

		// Create a UI message stream for better handling
		const stream = createUIMessageStream({
			execute: ({ writer: dataStream }) => {
				// Create session object for tools
				const session = { user: { id: userId } };

				// Local tool set that's always available (even when MCP is disabled)
				const localTools: ToolSet = {
					createArtifactTool: createArtifactTool({ 
						session, 
						dataStream,
						modelConfig: {
							apiKey,
							modelName: modelName || "gpt-4-turbo",
							baseUrl,
							providerType,
						}
					}),
					updateArtifactTool: updateArtifactTool({ 
						session, 
						dataStream,
						modelConfig: {
							apiKey,
							modelName: modelName || "gpt-4-turbo",
							baseUrl,
							providerType,
						}
					}),
				};

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

				// Let the model choose tools freely; never force a specific tool.
				const result = streamText(baseOpts);

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
