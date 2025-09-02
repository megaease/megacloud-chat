import { runPreviewReactAppTool } from "@/lib/ai/tools/preview-react-app-tool";
// app/api/preview/react-app/route.ts
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { artifactId, port, userId } = body;

		if (!artifactId) {
			return NextResponse.json(
				{ error: "Artifact ID is required" },
				{ status: 400 },
			);
		}

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 },
			);
		}

		const result = await runPreviewReactAppTool({
			artifactId,
			userId,
			port: port || 5173,
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Preview API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
