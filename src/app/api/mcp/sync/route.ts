import { getMCPConnectionManager } from "@/lib/mcp-connection-manager";
import { NextResponse } from "next/server";

export async function POST() {
	try {
		const mcpConnectionManager = getMCPConnectionManager();

		// Sync database status with actual connection status
		await mcpConnectionManager.syncDatabaseStatus();

		// Get updated connection statistics
		const stats = mcpConnectionManager.getConnectionStats();

		return NextResponse.json({
			success: true,
			message: "Database status sync completed",
			data: {
				stats,
			},
		});
	} catch (error) {
		console.error("Error syncing database status:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to sync database status",
			},
			{ status: 500 },
		);
	}
}
