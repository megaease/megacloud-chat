import { getMCPConnectionManager } from "@/lib/mcp-connection-manager";
import { NextResponse } from "next/server";

export async function POST() {
	try {
		const mcpConnectionManager = getMCPConnectionManager();

		// Initialize all active servers
		await mcpConnectionManager.initializeActiveServers();

		// Get updated connection statistics
		const stats = mcpConnectionManager.getConnectionStats();

		return NextResponse.json({
			success: true,
			message: "MCP servers initialization completed",
			data: {
				stats,
			},
		});
	} catch (error) {
		console.error("Error initializing MCP servers:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to initialize MCP servers",
			},
			{ status: 500 },
		);
	}
}
