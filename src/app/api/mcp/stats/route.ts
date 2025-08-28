import { getMCPConnectionManager } from "@/lib/mcp-connection-manager";
import { getMcpServers } from "@/lib/mcp-server-action";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		// 获取连接管理器实例
		const mcpConnectionManager = getMCPConnectionManager();
		const connectionStats = mcpConnectionManager.getConnectionStats();

		// 获取数据库中的所有服务器
		const serversResult = await getMcpServers();

		if (!serversResult.success) {
			return NextResponse.json({
				success: true,
				data: connectionStats,
				timestamp: new Date().toISOString(),
			});
		}

		const dbServers = serversResult.data || [];

		// 合并数据库状态和连接状态
		const enhancedConnections = dbServers.map((server) => {
			const connectionInfo = connectionStats.connections.find(
				(conn) => conn.serverId === server.id,
			);

			return {
				serverId: server.id,
				serverName: server.name,
				// 如果有连接信息，使用连接状态；否则根据数据库状态推断
				status:
					connectionInfo?.status ||
					(server.status === "online" ? "disconnected" : server.status),
				connectedAt: connectionInfo?.connectedAt,
				lastError: connectionInfo?.lastError,
				dbStatus: server.status,
			};
		});

		const enhancedStats = {
			...connectionStats,
			connections: enhancedConnections,
			totalServers: dbServers.length,
		};

		return NextResponse.json({
			success: true,
			data: enhancedStats,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error getting MCP connection stats:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
