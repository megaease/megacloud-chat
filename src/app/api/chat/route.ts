import { saveToChatsTable } from "@/server/db/chats";
import { saveToMessagesTable } from "@/server/db/messages";
import { db } from "@/server/db";
import { mcpServers, ServerStatusEnum, TypeEnum } from "@/server/db/schema";
import { createDeepSeek, deepseek } from "@ai-sdk/deepseek";
import { openai } from "@ai-sdk/openai";
import { createOpenAI } from "@ai-sdk/openai";
import {
	appendResponseMessages,
	experimental_createMCPClient as createMCPClient,
	streamText,
	type Tool,
	type ToolSet,
} from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import { eq } from "drizzle-orm";

export const maxDuration = 30;

type MCPClient = {
	tools: () => Promise<ToolSet>;
	close: () => Promise<void>;
};

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

	// Store all created MCP clients to close them after the request completes
	const mcpClients: { client: MCPClient; name: string }[] = [];

	try {
		// Initialize an empty tools object
		const mcpTools: ToolSet = {};

		// Only load MCP servers if MCP is enabled
		if (mcpEnabled !== false) {
			// Get all active MCP servers from the database
			const activeServers = await db
				.select()
				.from(mcpServers)
				.where(eq(mcpServers.status, ServerStatusEnum.ONLINE));

			console.log(`Found ${activeServers.length} active MCP servers`);

			// Create MCP clients and get tools for each active server
			for (const server of activeServers) {
				try {
					let client: MCPClient;

					// Create different clients based on server type
					if (server.type === TypeEnum.STDIO) {
						if (!server.command) {
							console.warn(`STDIO server ${server.name} missing command`);
							continue;
						}

						const transport = new Experimental_StdioMCPTransport({
							command: server.command,
							args: server.args as string[],
							env: server.env as Record<string, string>,
						});

						client = await createMCPClient({ transport });
					} else if (server.type === TypeEnum.SSE) {
						if (!server.url) {
							console.warn(`SSE server ${server.name} missing URL`);
							continue;
						}

						client = await createMCPClient({
							transport: {
								type: "sse",
								url: server.url,
								headers: server.headers as Record<string, string>,
							},
						});
					} else {
						console.warn(`Unknown server type: ${server.type}`);
						continue;
					}

					// Store client in array for later connection closing
					mcpClients.push({ client, name: server.name });

					// Get tools provided by this server
					const serverTools = await client.tools();

					// Merge server tools into main tool collection with server prefix to avoid conflicts
					for (const [toolName, toolImpl] of Object.entries(serverTools)) {
						const prefixedToolName = `${server.name}_${toolName}`;
						mcpTools[prefixedToolName] = toolImpl as Tool;
					}

					console.log(`Loaded tools from server ${server.name}`);
				} catch (error) {
					console.error(
						`Failed to connect to MCP server ${server.name}:`,
						error,
					);
				}
			} // End of for loop for active servers
		} else {
			console.log("MCP is disabled, skipping MCP servers and tools");
		}

		// Merge all tools
		const allTools = mcpEnabled
			? {
					...mcpTools,
				}
			: undefined;
		console.log("mcpTools", Object.keys(mcpTools));

		// close all MCP clients after processing
		const closeAllMcpClients = async () => {
			for (const { client, name } of mcpClients) {
				try {
					await client.close();
					console.log(`Connection to MCP server ${name} closed`);
				} catch (error) {
					console.error(`Error closing MCP server ${name} connection:`, error);
				}
			}
		};

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
		// const deepseek = createDeepSeek({
		// 	apiKey: apiKey,
		// });
		console.log(mcpEnabled, allTools, "allTools");
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

		// Ensure all client connections are closed in case of error
		for (const { client, name } of mcpClients) {
			try {
				await client.close();
				console.log(`Connection to MCP server ${name} closed`);
			} catch (closeError) {
				console.error(
					`Error closing MCP server ${name} connection:`,
					closeError,
				);
			}
		}
	}
}
