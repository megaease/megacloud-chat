import { NextResponse } from "next/server";
import { getMCPConnectionManager } from "@/lib/mcp-connection-manager";

export async function GET() {
	try {
		// 获取连接管理器实例
		const mcpConnectionManager = getMCPConnectionManager();
		const stats = mcpConnectionManager.getConnectionStats();

		return NextResponse.json({
			success: true,
			data: stats,
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
