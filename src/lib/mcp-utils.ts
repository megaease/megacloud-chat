import type { ToolSet } from "ai";

export type MCPClient = {
	tools: () => Promise<ToolSet>;
	close: () => Promise<void>;
};

type MCPClientWithName = {
	client: MCPClient;
	name: string;
};

/**
 * Loads and initializes MCP tools from all active connected servers
 * Now uses server-side connection manager and auto-initializes servers
 * @param mcpEnabled Whether MCP functionality is enabled
 * @returns Object containing MCP tools and client connections
 */
export async function loadMCPTools(mcpEnabled = true) {
	// Initialize an empty tools object
	let mcpTools: ToolSet = {};

	// Only load MCP servers if MCP is enabled
	if (mcpEnabled !== false) {
		try {
			// In server-side environment, dynamically import connection manager
			if (typeof window === "undefined") {
				const { getMCPConnectionManager } = await import(
					"./mcp-connection-manager"
				);
				const mcpConnectionManager = getMCPConnectionManager();

				// Initialize active servers first (this will connect servers marked as ONLINE)
				await mcpConnectionManager.initializeActiveServers();

				// Then get all connected tools
				mcpTools = await mcpConnectionManager.getAllConnectedTools();
				console.log(
					"Loaded MCP tools from connected servers:",
					Object.keys(mcpTools),
				);
			} else {
				// In client environment, get tools via API (if needed)
				console.log("MCP tools loading skipped on client side");
			}
		} catch (error) {
			console.error("Error loading MCP tools from connection manager:", error);
		}
	} else {
		console.log("MCP is disabled, skipping MCP servers and tools");
	}

	// Merge all tools
	const allTools = mcpEnabled ? { ...mcpTools } : undefined;
	console.log("mcpTools", Object.keys(mcpTools));

	// Close all MCP clients is managed by connection manager
	// Connection manager will close connections when appropriate
	const closeAllMcpClients = async () => {
		console.log(
			"Note: MCP clients are managed by connection manager, no immediate close needed",
		);
	};

	return { tools: allTools, clients: [], closeAllMcpClients };
}
