import { NextResponse } from "next/server";
import { getMCPConnectionManager } from "@/lib/mcp-connection-manager";
import {
	getMcpServerById,
	updateMcpServerStatus,
} from "@/lib/mcp-server-action";
import { ServerStatusEnum } from "@/server/db/schema";

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

		// 获取服务器配置
		const serverResult = await getMcpServerById(serverId);
		if (!serverResult.success || !serverResult.data) {
			return NextResponse.json({ error: "Server not found" }, { status: 404 });
		}

		const server = serverResult.data;

		// 获取连接管理器实例
		const mcpConnectionManager = getMCPConnectionManager();

		// 启动服务器连接
		const result = await mcpConnectionManager.startServer(server);

		if (result.success) {
			// 更新数据库状态为在线
			await updateMcpServerStatus(serverId, ServerStatusEnum.ONLINE);

			return NextResponse.json({
				success: true,
				message: `Server ${server.name} started successfully`,
			});
		}

		// 更新数据库状态为离线
		await updateMcpServerStatus(serverId, ServerStatusEnum.OFFLINE);

		return NextResponse.json(
			{
				success: false,
				error: result.error || "Failed to start server",
			},
			{ status: 500 },
		);
	} catch (error) {
		console.error("Error starting MCP server:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
