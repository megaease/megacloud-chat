import {
	createArtifact,
	getArtifactsByUserId,
	getPublicArtifacts,
	searchArtifacts,
} from "@/server/db/queries/artifacts";
import type { Artifact } from "@/server/db/schema";
// app/api/artifacts/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const createArtifactSchema = z.object({
	title: z.string().min(1, "Title is required"),
	content: z.string().min(1, "Content is required"),
	kind: z.enum(["text", "code", "sheet", "image"]),
	userId: z.string().min(1, "User ID is required"),
	chatId: z.string().min(1, "Chat ID is required"),
	tags: z.array(z.string()).optional(),
	isPublic: z.boolean().optional(),
});

// GET /api/artifacts - Get artifacts for user or public artifacts
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");
		const query = searchParams.get("query");
		const kind = searchParams.get("kind");
		const isPublic = searchParams.get("public") === "true";
		const limit = Number.parseInt(searchParams.get("limit") || "50");

		if (isPublic) {
			// Get public artifacts
			const artifacts = await getPublicArtifacts(limit);
			return NextResponse.json({ artifacts });
		}

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 },
			);
		}

		let artifacts: Artifact[];
		if (query) {
			// Search artifacts
			artifacts = await searchArtifacts(
				userId,
				query,
				kind || undefined,
				limit,
			);
		} else {
			// Get all user artifacts
			artifacts = await getArtifactsByUserId(userId, limit);
		}

		return NextResponse.json({ artifacts });
	} catch (error) {
		console.error("Error fetching artifacts:", error);
		return NextResponse.json(
			{ error: "Failed to fetch artifacts" },
			{ status: 500 },
		);
	}
}

// POST /api/artifacts - Create new artifact
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validatedData = createArtifactSchema.parse(body);

		const artifact = await createArtifact(validatedData);

		return NextResponse.json({ artifact }, { status: 201 });
	} catch (error) {
		console.error("Error creating artifact:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Validation failed", details: error.errors },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{ error: "Failed to create artifact" },
			{ status: 500 },
		);
	}
}
