import { getMCPConnectionManager } from "@/lib/mcp-connection-manager";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const mcpConnectionManager = getMCPConnectionManager();

		// Get connection statistics
		const stats = mcpConnectionManager.getConnectionStats();

		// Get connected servers details
		const connectedServers =
			await mcpConnectionManager.getEnabledConnectedServers();

		return NextResponse.json({
			success: true,
			data: {
				stats,
				connectedServers,
			},
		});
	} catch (error) {
		console.error("Error getting MCP connection status:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to get MCP connection status",
			},
			{ status: 500 },
		);
	}
}
