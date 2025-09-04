// app/api/react-app/sandbox/server/stop/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getSandbox } from "@/lib/services/react-app-service";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { userId, artifactId } = body;

		if (!userId || !artifactId) {
			return NextResponse.json(
				{ error: "UserId and artifactId are required" },
				{ status: 400 },
			);
		}

		const sandbox = getSandbox(userId, artifactId);
		if (!sandbox) {
			return NextResponse.json({ error: "Sandbox not found" }, { status: 404 });
		}

		// Stop the sandbox
		await sandbox.kill();

		return NextResponse.json({
			success: true,
			message: "Sandbox stopped successfully",
		});
	} catch (error) {
		console.error("Sandbox stop API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
