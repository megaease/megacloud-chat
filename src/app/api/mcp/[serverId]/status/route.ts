import { NextResponse } from "next/server";
import { getMCPConnectionManager } from "@/lib/mcp-connection-manager";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ serverId: string }> },
) {
	try {
		const { serverId: serverIdParam } = await params;
		const serverId = Number.parseInt(serverIdParam);

		if (Number.isNaN(serverId)) {
			return NextResponse.json({ error: "Invalid server ID" }, { status: 400 });
		}

		// 获取连接管理器实例
		const mcpConnectionManager = getMCPConnectionManager();

		const status = mcpConnectionManager.getConnectionStatus(serverId);
		const isConnected = mcpConnectionManager.isConnected(serverId);

		return NextResponse.json({
			serverId,
			status,
			isConnected,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error getting MCP server status:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
