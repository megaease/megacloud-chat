// app/api/react-app/sandbox/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSandbox } from "@/lib/services/react-app-service";

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

		const result = await createSandbox(userId, artifactId);
		return NextResponse.json(result);
	} catch (error) {
		console.error("Sandbox creation API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}