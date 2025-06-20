// app/api/artifacts/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
	getArtifactById,
	updateArtifact,
	deleteArtifact,
	getArtifactVersions,
} from "@/server/db/queries/artifacts";
import { z } from "zod";

const updateArtifactSchema = z.object({
	title: z.string().optional(),
	content: z.string().optional(),
	kind: z.enum(["text", "code", "sheet", "image"]).optional(),
	userId: z.string().min(1, "User ID is required"),
	changeDescription: z.string().optional(),
	tags: z.array(z.string()).optional(),
	isPublic: z.boolean().optional(),
});

interface RouteContext {
	params: Promise<{ id: string }>;
}

// GET /api/artifacts/[id] - Get single artifact
export async function GET(request: NextRequest, { params }: RouteContext) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");
		const includeVersions = searchParams.get("versions") === "true";

		const { id } = await params;
		const artifact = await getArtifactById(id, userId || undefined);

		if (!artifact) {
			return NextResponse.json(
				{ error: "Artifact not found" },
				{ status: 404 },
			);
		}

		let versions = null;
		if (includeVersions && userId) {
			versions = await getArtifactVersions(id, userId);
		}

		return NextResponse.json({
			artifact,
			...(versions && { versions }),
		});
	} catch (error) {
		console.error("Error fetching artifact:", error);
		return NextResponse.json(
			{ error: "Failed to fetch artifact" },
			{ status: 500 },
		);
	}
}

// PUT /api/artifacts/[id] - Update artifact
export async function PUT(request: NextRequest, { params }: RouteContext) {
	try {
		const body = await request.json();
		const validatedData = updateArtifactSchema.parse(body);

		const { id } = await params;
		const artifact = await updateArtifact({
			artifactId: id,
			...validatedData,
		});

		if (!artifact) {
			return NextResponse.json(
				{ error: "Artifact not found or access denied" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ artifact });
	} catch (error) {
		console.error("Error updating artifact:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Validation failed", details: error.errors },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{ error: "Failed to update artifact" },
			{ status: 500 },
		);
	}
}

// DELETE /api/artifacts/[id] - Delete artifact
export async function DELETE(request: NextRequest, { params }: RouteContext) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 },
			);
		}

		const { id } = await params;
		const deleted = await deleteArtifact(id, userId);

		if (!deleted) {
			return NextResponse.json(
				{ error: "Artifact not found or access denied" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting artifact:", error);
		return NextResponse.json(
			{ error: "Failed to delete artifact" },
			{ status: 500 },
		);
	}
}
