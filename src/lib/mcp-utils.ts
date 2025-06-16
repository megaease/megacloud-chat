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
 * 现在使用服务器端连接管理器通过 API 获取工具
 * @param mcpEnabled Whether MCP functionality is enabled
 * @returns Object containing MCP tools and client connections
 */
export async function loadMCPTools(mcpEnabled = true) {
	// Initialize an empty tools object
	let mcpTools: ToolSet = {};

	// Only load MCP servers if MCP is enabled
	if (mcpEnabled !== false) {
		try {
			// 在服务器端环境中，动态导入连接管理器
			if (typeof window === "undefined") {
				const { getMCPConnectionManager } = await import(
					"./mcp-connection-manager"
				);
				const mcpConnectionManager = getMCPConnectionManager();
				mcpTools = await mcpConnectionManager.getAllConnectedTools();
				console.log(
					"Loaded MCP tools from connected servers:",
					Object.keys(mcpTools),
				);
			} else {
				// 在客户端环境中，通过 API 获取工具（如果需要的话）
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

	// 由于使用持久连接，不需要立即关闭客户端
	// 连接管理器会在适当的时候关闭连接
	const closeAllMcpClients = async () => {
		console.log(
			"Note: MCP clients are managed by connection manager, no immediate close needed",
		);
	};

	return { tools: allTools, clients: [], closeAllMcpClients };
}
