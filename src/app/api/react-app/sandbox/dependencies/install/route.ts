// app/api/react-app/sandbox/dependencies/install/route.ts
import { NextRequest, NextResponse } from "next/server";
import { installDependencies, getSandbox } from "@/lib/services/react-app-service";

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
			return NextResponse.json(
				{ error: "Sandbox not found" },
				{ status: 404 }
			);
		}

		const result = await installDependencies(sandbox);
		return NextResponse.json(result);
	} catch (error) {
		console.error("Dependency installation API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}