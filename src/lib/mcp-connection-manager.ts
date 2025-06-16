// 服务器端 MCP 连接管理器
// 此文件只能在服务器端使用，不能在客户端导入
import "server-only";
import type { ToolSet } from "ai";
import { TypeEnum, type McpServer } from "@/server/db/schema";

export type MCPClient = {
	tools: () => Promise<ToolSet>;
	close: () => Promise<void>;
};

export type ConnectionStatus =
	| "disconnected"
	| "connecting"
	| "connected"
	| "error"
	| "reconnecting";

interface ConnectionInfo {
	client: MCPClient;
	status: ConnectionStatus;
	connectedAt: Date;
	lastError?: string;
	server: McpServer;
}

class MCPConnectionManager {
	private connections = new Map<number, ConnectionInfo>();
	private statusListeners = new Set<
		(serverId: number, status: ConnectionStatus) => void
	>();

	/**
	 * 启动 MCP 服务器连接
	 */
	async startServer(
		server: McpServer,
	): Promise<{ success: boolean; error?: string }> {
		// 检查运行环境
		if (typeof window !== "undefined") {
			throw new Error(
				"MCP Connection Manager can only be used on the server side",
			);
		}

		try {
			// 动态导入 AI SDK 和 MCP 传输，避免客户端打包
			const [
				{ experimental_createMCPClient: createMCPClient },
				{ Experimental_StdioMCPTransport },
			] = await Promise.all([import("ai"), import("ai/mcp-stdio")]);

			// 如果已经连接，先断开
			if (this.connections.has(server.id)) {
				await this.stopServer(server.id);
			}

			this.updateStatus(server.id, "connecting");

			let client: MCPClient;

			// 根据服务器类型创建不同的客户端
			if (server.type === TypeEnum.STDIO) {
				if (!server.command) {
					throw new Error("STDIO server missing command");
				}

				const transport = new Experimental_StdioMCPTransport({
					command: server.command,
					args: server.args as string[],
					env: server.env as Record<string, string>,
				});

				client = await createMCPClient({ transport });
			} else if (server.type === TypeEnum.SSE) {
				if (!server.url) {
					throw new Error("SSE server missing URL");
				}

				client = await createMCPClient({
					transport: {
						type: "sse",
						url: server.url,
						headers: server.headers as Record<string, string>,
					},
				});
			} else {
				throw new Error(`Unknown server type: ${server.type}`);
			}

			// 测试连接是否可用
			await client.tools();

			// 存储连接信息
			this.connections.set(server.id, {
				client,
				status: "connected",
				connectedAt: new Date(),
				server,
			});

			this.updateStatus(server.id, "connected");
			console.log(`MCP server ${server.name} started successfully`);

			return { success: true };
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			console.error(`Failed to start MCP server ${server.name}:`, error);

			// 清理可能的部分连接
			this.connections.delete(server.id);
			this.updateStatus(server.id, "error");

			return { success: false, error: errorMessage };
		}
	}

	/**
	 * 停止 MCP 服务器连接
	 */
	async stopServer(serverId: number): Promise<void> {
		const connection = this.connections.get(serverId);
		if (!connection) {
			return;
		}

		try {
			await connection.client.close();
			console.log(`MCP server ${connection.server.name} stopped`);
		} catch (error) {
			console.error(
				`Error stopping MCP server ${connection.server.name}:`,
				error,
			);
		} finally {
			this.connections.delete(serverId);
			this.updateStatus(serverId, "disconnected");
		}
	}

	/**
	 * 获取服务器连接状态
	 */
	getConnectionStatus(serverId: number): ConnectionStatus {
		const connection = this.connections.get(serverId);
		return connection?.status || "disconnected";
	}

	/**
	 * 检查服务器是否已连接
	 */
	isConnected(serverId: number): boolean {
		return this.getConnectionStatus(serverId) === "connected";
	}

	/**
	 * 获取已连接的客户端
	 */
	getClient(serverId: number): MCPClient | undefined {
		const connection = this.connections.get(serverId);
		return connection?.status === "connected" ? connection.client : undefined;
	}

	/**
	 * 获取所有已连接的服务器工具
	 */
	async getAllConnectedTools(): Promise<ToolSet> {
		const allTools: ToolSet = {};

		for (const [serverId, connection] of this.connections) {
			if (connection.status !== "connected") {
				continue;
			}

			try {
				const serverTools = await connection.client.tools();

				// 使用服务器名称作为前缀避免工具名冲突
				for (const [toolName, toolImpl] of Object.entries(serverTools)) {
					const prefixedToolName = `${connection.server.name}_${toolName}`;
					allTools[prefixedToolName] = toolImpl;
				}
			} catch (error) {
				console.error(
					`Failed to get tools from server ${connection.server.name}:`,
					error,
				);
				// 标记连接为错误状态
				connection.status = "error";
				connection.lastError =
					error instanceof Error ? error.message : "Unknown error";
				this.updateStatus(serverId, "error");
			}
		}

		return allTools;
	}

	/**
	 * 获取连接统计信息
	 */
	getConnectionStats() {
		const stats = {
			total: this.connections.size,
			connected: 0,
			connecting: 0,
			error: 0,
			connections: [] as Array<{
				serverId: number;
				serverName: string;
				status: ConnectionStatus;
				connectedAt?: Date;
				lastError?: string;
			}>,
		};

		for (const [serverId, connection] of this.connections) {
			stats.connections.push({
				serverId,
				serverName: connection.server.name,
				status: connection.status,
				connectedAt: connection.connectedAt,
				lastError: connection.lastError,
			});

			switch (connection.status) {
				case "connected":
					stats.connected++;
					break;
				case "connecting":
				case "reconnecting":
					stats.connecting++;
					break;
				case "error":
					stats.error++;
					break;
			}
		}

		return stats;
	}

	/**
	 * 关闭所有连接
	 */
	async closeAll(): Promise<void> {
		const promises = Array.from(this.connections.keys()).map((serverId) =>
			this.stopServer(serverId),
		);
		await Promise.all(promises);
	}

	/**
	 * 添加状态监听器
	 */
	onStatusChange(
		listener: (serverId: number, status: ConnectionStatus) => void,
	): () => void {
		this.statusListeners.add(listener);
		return () => this.statusListeners.delete(listener);
	}

	/**
	 * 更新状态并通知监听器
	 */
	private updateStatus(serverId: number, status: ConnectionStatus): void {
		const connection = this.connections.get(serverId);
		if (connection) {
			connection.status = status;
		}

		// 通知所有监听器
		for (const listener of this.statusListeners) {
			try {
				listener(serverId, status);
			} catch (error) {
				console.error("Error in status listener:", error);
			}
		}
	}

	/**
	 * 健康检查 - 验证连接是否仍然有效
	 */
	async healthCheck(serverId: number): Promise<boolean> {
		const connection = this.connections.get(serverId);
		if (!connection || connection.status !== "connected") {
			return false;
		}

		try {
			// 尝试获取工具列表来测试连接
			await connection.client.tools();
			return true;
		} catch (error) {
			console.error(
				`Health check failed for server ${connection.server.name}:`,
				error,
			);
			connection.status = "error";
			connection.lastError =
				error instanceof Error ? error.message : "Health check failed";
			this.updateStatus(serverId, "error");
			return false;
		}
	}
}

// 创建全局单例（仅在服务器端）
let serverMcpConnectionManager: MCPConnectionManager | null = null;

export function getMCPConnectionManager(): MCPConnectionManager {
	if (typeof window !== "undefined") {
		throw new Error(
			"MCP Connection Manager can only be used on the server side",
		);
	}

	if (!serverMcpConnectionManager) {
		serverMcpConnectionManager = new MCPConnectionManager();
	}

	return serverMcpConnectionManager;
}
