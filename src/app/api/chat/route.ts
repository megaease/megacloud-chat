import { MCPClientManager } from "@/lib/mcp-client";
import { saveToChatsTable } from "@/server/db/chats";
import { saveToMessagesTable } from "@/server/db/messages";
import { db } from "@/server/db";
import { mcpServers, ServerStatusEnum, TypeEnum } from "@/server/db/schema";
import { deepseek } from "@ai-sdk/deepseek";
import { openai } from "@ai-sdk/openai";
import {
	appendResponseMessages,
	experimental_createMCPClient as createMCPClient,
	streamText,
	type Tool,
	type ToolSet,
} from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
	console.log("POST /api/chat");
	const { messages, userId, chatId } = await req.json();

	if (!messages) {
		return new Response("Invalid request", { status: 400 });
	}
	if (!userId) {
		return Response.json({ error: "User ID is required" }, { status: 400 });
	}

	// 存储所有创建的 MCP 客户端，以便在请求完成后关闭它们
	const mcpClients: { client: MCPClientManager; name: string }[] = [];

	try {
		// 从数据库中获取所有 active 的 MCP 服务器
		const activeServers = await db
			.select()
			.from(mcpServers)
			.where(eq(mcpServers.status, ServerStatusEnum.ONLINE));

		console.log(`找到 ${activeServers.length} 个活跃的 MCP 服务器`);

		// 初始化一个空的 tools 对象
		const mcpTools: ToolSet = {};

		// 为每个活跃的服务器创建 MCP 客户端并获取工具
		for (const server of activeServers) {
			try {
				let client: MCPClientManager;

				// 根据服务器类型创建不同的客户端
				if (server.type === TypeEnum.STDIO) {
					if (!server.command) {
						console.warn(`STDIO 服务器 ${server.name} 缺少命令`);
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
						console.warn(`SSE 服务器 ${server.name} 缺少 URL`);
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
					console.warn(`未知的服务器类型：${server.type}`);
					continue;
				}

				// 将客户端存储在数组中，以便后续关闭连接
				mcpClients.push({ client, name: server.name });

				// 获取该服务器提供的工具
				const serverTools = await client.tools();

				// 将服务器工具合并到主工具集合中，添加服务器前缀避免冲突
				for (const [toolName, toolImpl] of Object.entries(serverTools)) {
					const prefixedToolName = `${server.name}_${toolName}`;
					mcpTools[prefixedToolName] = toolImpl as Tool<any, any>;
				}

				console.log(`已从服务器 ${server.name} 加载工具`);
			} catch (error) {
				console.error(`连接到 MCP 服务器 ${server.name} 失败:`, error);
			}
		}

		// 添加内置工具
		const builtInTools = {
			sayHello: {
				description: "Say hello to the user",
				parameters: z.object({
					name: z.string().describe("The name of the user"),
				}),
				execute: async (args: { name: string }) => {
					console.log("sayHello", args);
					return {
						message: `Hello, ${args.name}! mcp`,
					};
				},
			},
		};

		// 合并所有工具
		const allTools = {
			...builtInTools,
			...mcpTools,
		};
		console.log("mcpTools", Object.keys(mcpTools));

		// 用于关闭所有 MCP 客户端连接的函数
		const closeAllMcpClients = async () => {
			for (const { client, name } of mcpClients) {
				try {
					await client.close();
					console.log(`已关闭 MCP 服务器 ${name} 的连接`);
				} catch (error) {
					console.error(`关闭 MCP 服务器 ${name} 连接时出错:`, error);
				}
			}
		};

		const result = streamText({
			model: deepseek("deepseek-chat"),
			messages,
			tools: allTools,
			onError: async (error) => {
				console.error("AI Stream error:", error);
				// 发生错误时关闭所有连接
				await closeAllMcpClients();
			},
			onFinish: async (result) => {
				const allMessages = appendResponseMessages({
					messages,
					responseMessages: result.response.messages,
				});
				await saveToChatsTable(userId, chatId, allMessages);
				await saveToMessagesTable(chatId, allMessages);

				// 请求完成后关闭所有连接
				await closeAllMcpClients();
			},
		});
		console.log("currentChatId", chatId);

		return result.toDataStreamResponse({});
	} catch (error) {
		console.error("处理请求时出错：", error);

		// 在发生错误时确保关闭所有客户端连接
		for (const { client, name } of mcpClients) {
			try {
				await client.close();
				console.log(`已关闭 MCP 服务器 ${name} 的连接`);
			} catch (closeError) {
				console.error(`关闭 MCP 服务器 ${name} 连接时出错:`, closeError);
			}
		}

		return new Response("Internal Server Error", { status: 500 });
	}
}
