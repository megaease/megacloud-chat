// app/api/react-app/sandbox/files/write/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFilesToSandbox, getSandbox } from "@/lib/services/react-app-service";
import type { ReactAppFile } from "@/lib/artifact-types";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { userId, artifactId, files } = body;

		if (!userId || !artifactId || !files || !Array.isArray(files)) {
			return NextResponse.json(
				{ error: "UserId, artifactId, and files array are required" },
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

		const result = await writeFilesToSandbox(sandbox, files);
		return NextResponse.json(result);
	} catch (error) {
		console.error("File writing API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}