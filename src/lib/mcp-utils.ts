import { db } from "@/server/db";
import { mcpServers, ServerStatusEnum, TypeEnum } from "@/server/db/schema";
import {
	experimental_createMCPClient as createMCPClient,
	type Tool,
	type ToolSet,
} from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import { eq } from "drizzle-orm";

export type MCPClient = {
	tools: () => Promise<ToolSet>;
	close: () => Promise<void>;
};

type MCPClientWithName = {
	client: MCPClient;
	name: string;
};

/**
 * Loads and initializes MCP tools from all active servers in the database
 * @param mcpEnabled Whether MCP functionality is enabled
 * @returns Object containing MCP tools and client connections
 */
export async function loadMCPTools(mcpEnabled = true) {
	// Store all created MCP clients to close them after the request completes
	const mcpClients: MCPClientWithName[] = [];
	// Initialize an empty tools object
	const mcpTools: ToolSet = {};

	// Only load MCP servers if MCP is enabled
	if (mcpEnabled !== false) {
		try {
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
		} catch (error) {
			console.error("Error loading MCP servers:", error);
		}
	} else {
		console.log("MCP is disabled, skipping MCP servers and tools");
	}

	// Merge all tools
	const allTools = mcpEnabled ? { ...mcpTools } : undefined;
	console.log("mcpTools", Object.keys(mcpTools));

	// Helper function to close all MCP client connections
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

	return { tools: allTools, clients: mcpClients, closeAllMcpClients };
}
