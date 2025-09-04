// app/api/react-app/sandbox/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSandbox } from "@/lib/services/react-app-service";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { userId, artifactId } = body;

		if (!userId || !artifactId) {
			return NextResponse.json(
				{ error: "UserId and artifactId are required" },
				{ status: 400 }
			);
		}

		const sandbox = getSandbox(userId, artifactId);
		if (!sandbox) {
			return NextResponse.json({
				success: true,
				status: "not_found",
				message: "Sandbox not found",
			});
		}

		// Try to get the preview URL to check if the sandbox is running
		try {
			const previewUrl = sandbox.getHost(5173);
			return NextResponse.json({
				success: true,
				status: "running",
				previewUrl: previewUrl.startsWith("http") ? previewUrl : `https://${previewUrl}`,
				message: "Sandbox is running",
			});
		} catch (error) {
			return NextResponse.json({
				success: true,
				status: "stopped",
				message: "Sandbox exists but not running",
			});
		}
	} catch (error) {
		console.error("Sandbox status API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}