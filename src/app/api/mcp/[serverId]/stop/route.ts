import { getMCPConnectionManager } from "@/lib/mcp-connection-manager";
import { updateMcpServerStatus } from "@/lib/mcp-server-action";
import { ServerStatusEnum } from "@/server/db/schema";
import { NextResponse } from "next/server";

export async function POST(
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

		// 停止服务器连接
		await mcpConnectionManager.stopServer(serverId);

		// 更新数据库状态为离线
		await updateMcpServerStatus(serverId, ServerStatusEnum.OFFLINE);

		return NextResponse.json({
			success: true,
			message: "Server stopped successfully",
		});
	} catch (error) {
		console.error("Error stopping MCP server:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
