"use server";

import {
	insertMcpServerSchema,
	mcpServers,
	type McpServerUpdate,
	type ServerStatus,
	ServerStatusEnum,
	TypeEnum,
} from "@/server/db/schema";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import {
	experimental_createMCPClient as createMCPClient,
	streamText,
} from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";

// Create a new MCP server
export async function createMcpServer(
	data: z.infer<typeof insertMcpServerSchema>,
) {
	try {
		// Validate the data
		const validatedData = insertMcpServerSchema.parse(data);

		// Insert the new server
		const [newServer] = await db
			.insert(mcpServers)
			.values(validatedData)
			.returning();

		// Revalidate the path to update the UI
		revalidatePath("/");

		return { success: true, data: newServer };
	} catch (error: any) {
		console.error("Failed to create MCP server:", error);

		// Handle validation errors
		if (error.name === "ZodError") {
			return {
				success: false,
				error: "Validation error",
				details: error.errors,
			};
		}

		return { success: false, error: "Failed to create MCP server" };
	}
}

// Get all MCP servers
export async function getMcpServers() {
	try {
		const servers = await db
			.select()
			.from(mcpServers)
			.orderBy(mcpServers.createdAt);
		return { success: true, data: servers };
	} catch (error) {
		console.error("Failed to fetch MCP servers:", error);
		return { success: false, error: "Failed to fetch MCP servers" };
	}
}

// Get a specific MCP server by ID
export async function getMcpServerById(id: number) {
	try {
		const [server] = await db
			.select()
			.from(mcpServers)
			.where(eq(mcpServers.id, id));

		if (!server) {
			return { success: false, error: "MCP server not found" };
		}

		return { success: true, data: server };
	} catch (error) {
		console.error("Failed to fetch MCP server:", error);
		return { success: false, error: "Failed to fetch MCP server" };
	}
}

// Update a specific MCP server by ID
export async function updateMcpServer(id: number, data: McpServerUpdate) {
	try {
		// Check if server exists
		const [existingServer] = await db
			.select()
			.from(mcpServers)
			.where(eq(mcpServers.id, id));

		if (!existingServer) {
			return { success: false, error: "MCP server not found" };
		}

		// Update the server with the new data
		const [updatedServer] = await db
			.update(mcpServers)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(mcpServers.id, id))
			.returning();

		// Revalidate the path to update the UI
		revalidatePath("/");

		return { success: true, data: updatedServer };
	} catch (error) {
		console.error("Failed to update MCP server:", error);
		return { success: false, error: "Failed to update MCP server" };
	}
}

// Delete a specific MCP server by ID
export async function deleteMcpServer(id: number) {
	try {
		// Check if server exists
		const [existingServer] = await db
			.select()
			.from(mcpServers)
			.where(eq(mcpServers.id, id));

		if (!existingServer) {
			return { success: false, error: "MCP server not found" };
		}

		// Delete the server
		await db.delete(mcpServers).where(eq(mcpServers.id, id));

		// Revalidate the path to update the UI
		revalidatePath("/");

		return { success: true };
	} catch (error) {
		console.error("Failed to delete MCP server:", error);
		return { success: false, error: "Failed to delete MCP server" };
	}
}

// Update server status
export async function updateMcpServerStatus(id: number, status: ServerStatus) {
	try {
		// Check if server exists
		const [existingServer] = await db
			.select()
			.from(mcpServers)
			.where(eq(mcpServers.id, id));

		if (!existingServer) {
			return { success: false, error: "MCP server not found" };
		}

		// Update data object
		const updateData: any = {
			status,
			updatedAt: new Date(),
		};

		// If the status is changing to online, update the lastConnected timestamp
		if (status === ServerStatusEnum.ONLINE) {
			updateData.lastConnected = new Date();
		}

		// Update the server with the new status
		const [updatedServer] = await db
			.update(mcpServers)
			.set(updateData)
			.where(eq(mcpServers.id, id))
			.returning();

		// Revalidate the path to update the UI
		revalidatePath("/");

		return { success: true, data: updatedServer };
	} catch (error) {
		console.error("Failed to update MCP server status:", error);
		return { success: false, error: "Failed to update MCP server status" };
	}
}

export async function getActiveMcpServers() {
	try {
		const servers = await db
			.select()
			.from(mcpServers)
			.where(eq(mcpServers.status, ServerStatusEnum.ONLINE));

		return { success: true, data: servers };
	} catch (error) {
		console.error("Error fetching active MCP servers:", error);
		return { success: false, error: "Failed to fetch active MCP servers" };
	}
}

export async function getMcpTools(serverId: number) {
	try {
		const [server] = await db
			.select()
			.from(mcpServers)
			.where(eq(mcpServers.id, serverId));

		if (!server) {
			return { success: false, error: "Server not found" };
		}

		const headers = server.headers || {};

		// 根据连接类型创建 MCP 客户端
		let client;
		if (server.type === TypeEnum.SSE && server.url) {
			client = await createMCPClient({
				transport: {
					type: "sse",
					url: server.url,
					headers,
				},
			});
		} else if (server.type === TypeEnum.STDIO && server.command) {
			const args = server.args || [];

			const env = {
				...process.env,
				...(server.env || {}),
			} as Record<string, string>;

			client = await createMCPClient({
				transport: new Experimental_StdioMCPTransport({
					command: server.command,
					args,
					env,
					stderr: "inherit",
				}),
			});
		}

		if (!client) {
			return { success: false, error: "Failed to create MCP client" };
		}

		// 获取此服务器提供的工具
		const tools = await client.tools();

		// 为工具名称添加前缀，避免不同服务器之间的冲突
		const prefixedTools = Object.entries(tools).reduce(
			(acc: Record<string, unknown>, [toolName, tool]) => {
				const prefixedName = `${server.name.toLowerCase().replace(/\s+/g, "_")}.${toolName}`;
				acc[prefixedName] = tool;
				return acc;
			},
			{} as Record<string, unknown>,
		);

		client.close();

		return {
			success: true,
			data: {
				tools: prefixedTools,
				serverName: server.name,
			},
		};
	} catch (error) {
		console.error(`Error getting MCP tools for server ${serverId}:`, error);
		return { success: false, error: `Failed to get MCP tools: ${error}` };
	}
}

export async function processChatWithMcp(activeServerIds: number[]) {
	try {
		const toolsPromises = activeServerIds.map((id) => getMcpTools(id));
		const toolsResults = await Promise.all(toolsPromises);

		const toolToServerMap = new Map();

		// 合并所有工具
		const allTools = toolsResults.reduce(
			(acc: Record<string, unknown>, result) => {
				if (result.success && result.data?.tools) {
					// 记录每个工具来自哪个服务器
					for (const toolName of Object.keys(result.data.tools)) {
						toolToServerMap.set(toolName, result.data.serverName);
					}

					for (const key in result.data.tools) {
						acc[key] = result.data.tools[key];
					}
					return acc;
				}
				return acc;
			},
			{},
		);
		return allTools;
	} catch (error) {
		console.error("Error processing chat with MCP:", error);
	}
}

export async function getAllTools() {
	try {
		const servers = await getActiveMcpServers();
		if (!servers.success) {
			throw new Error(servers.error);
		}

		const activeServerIds = servers.data
			? servers.data.map((server) => server.id)
			: [];
		return processChatWithMcp(activeServerIds);
	} catch (error) {
		console.error("Error getting all tools:", error);
	}
}
