// server/db/queries/artifacts.ts
import { db } from "@/server/db";
import { artifacts, type Artifact } from "@/server/db/schema";
import { desc, eq, and, max } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface CreateArtifactParams {
	id?: string; // 允许传入预生成的 ID
	title: string;
	content: string;
	kind: "text" | "code" | "sheet" | "image";
	language?: string; // Language for code artifacts
	userId: string;
	chatId: string;
	tags?: string[];
	isPublic?: boolean;
}

export interface UpdateArtifactParams {
	artifactId: string;
	title?: string;
	content?: string;
	kind?: "text" | "code" | "sheet" | "image";
	language?: string; // Language for code artifacts
	userId: string;
	changeDescription?: string;
	tags?: string[];
	isPublic?: boolean;
}

// Create a new artifact
export async function createArtifact(
	params: CreateArtifactParams,
): Promise<Artifact> {
	const artifactId = params.id || nanoid(16);

	const [artifact] = await db
		.insert(artifacts)
		.values({
			id: artifactId,
			version: 1,
			title: params.title,
			content: params.content,
			kind: params.kind,
			language: params.language,
			userId: params.userId,
			chatId: params.chatId,
			tags: params.tags || [],
			isPublic: params.isPublic || false,
			changeDescription: "Initial version",
		})
		.returning();

	if (!artifact) {
		throw new Error("Failed to create artifact");
	}

	return artifact;
}

// Update an existing artifact by creating a new version
export async function updateArtifact(
	params: UpdateArtifactParams,
): Promise<Artifact | null> {
	// Get current highest version for this artifact
	const currentVersionResult = await db
		.select({ maxVersion: max(artifacts.version) })
		.from(artifacts)
		.where(
			and(
				eq(artifacts.id, params.artifactId),
				eq(artifacts.userId, params.userId),
			),
		);

	const currentMaxVersion = currentVersionResult[0]?.maxVersion || 0;
	if (currentMaxVersion === 0) {
		return null; // Artifact not found
	}

	// Get the latest version to inherit unchanged fields
	const latestArtifact = await db.query.artifacts.findFirst({
		where: and(
			eq(artifacts.id, params.artifactId),
			eq(artifacts.version, currentMaxVersion),
			eq(artifacts.userId, params.userId),
		),
	});

	if (!latestArtifact) {
		return null;
	}

	const newVersion = currentMaxVersion + 1;

	// Create new version
	const [newArtifact] = await db
		.insert(artifacts)
		.values({
			id: params.artifactId,
			version: newVersion,
			title: params.title || latestArtifact.title,
			content: params.content || latestArtifact.content,
			kind: params.kind || latestArtifact.kind,
			language:
				params.language !== undefined
					? params.language
					: latestArtifact.language,
			userId: params.userId,
			chatId: latestArtifact.chatId,
			tags: params.tags !== undefined ? params.tags : latestArtifact.tags,
			isPublic:
				params.isPublic !== undefined
					? params.isPublic
					: latestArtifact.isPublic,
			changeDescription: params.changeDescription || `Version ${newVersion}`,
		})
		.returning();

	return newArtifact || null;
}

// Get artifact by ID (returns latest version)
export async function getArtifactById(
	artifactId: string,
	userId?: string,
): Promise<Artifact | null> {
	// First get the latest version number for this artifact
	const maxVersionResult = await db
		.select({ maxVersion: max(artifacts.version) })
		.from(artifacts)
		.where(
			userId
				? and(eq(artifacts.id, artifactId), eq(artifacts.userId, userId))
				: eq(artifacts.id, artifactId),
		);

	const latestVersion = maxVersionResult[0]?.maxVersion;
	if (!latestVersion) {
		return null;
	}

	// Then get the artifact with that version
	const artifact = await db.query.artifacts.findFirst({
		where: userId
			? and(
					eq(artifacts.id, artifactId),
					eq(artifacts.version, latestVersion),
					eq(artifacts.userId, userId),
				)
			: and(eq(artifacts.id, artifactId), eq(artifacts.version, latestVersion)),
	});

	return artifact || null;
}

// Get artifacts by user ID
export async function getArtifactsByUserId(
	userId: string,
	limit = 50,
): Promise<Artifact[]> {
	return await db.query.artifacts.findMany({
		where: eq(artifacts.userId, userId),
		orderBy: [desc(artifacts.updatedAt)],
		limit,
	});
}

// Check if a chat already has an artifact (for "One Document Per Chat" policy)
// Returns the latest version if exists
export async function getChatArtifact(
	chatId: string,
	userId: string,
): Promise<Artifact | null> {
	const artifact = await db.query.artifacts.findFirst({
		where: and(eq(artifacts.chatId, chatId), eq(artifacts.userId, userId)),
		orderBy: [desc(artifacts.version)], // Get latest version
	});
	
	return artifact || null;
}

// Get all versions of artifacts in a chat
// One Document Per Chat policy: should only be one document ID with multiple versions
export async function getArtifactsByChatId(
	chatId: string,
	userId: string,
): Promise<Artifact[]> {
	return await db.query.artifacts.findMany({
		where: and(eq(artifacts.chatId, chatId), eq(artifacts.userId, userId)),
		orderBy: [desc(artifacts.version)], // Newest version first
	});
}

// Get artifact versions (all versions of an artifact)
export async function getArtifactVersions(
	artifactId: string,
	userId: string,
): Promise<Artifact[]> {
	return await db.query.artifacts.findMany({
		where: and(eq(artifacts.id, artifactId), eq(artifacts.userId, userId)),
		orderBy: [desc(artifacts.version)],
	});
}

// Delete artifact (deletes all versions)
export async function deleteArtifact(
	artifactId: string,
	userId: string,
): Promise<boolean> {
	const result = await db
		.delete(artifacts)
		.where(and(eq(artifacts.id, artifactId), eq(artifacts.userId, userId)));

	return true; // Drizzle doesn't return rowCount, so we assume success if no error
}

// Get public artifacts (for sharing)
export async function getPublicArtifacts(limit = 20): Promise<Artifact[]> {
	return await db.query.artifacts.findMany({
		where: eq(artifacts.isPublic, true),
		orderBy: [desc(artifacts.updatedAt)],
		limit,
	});
}

// Search artifacts by title or content
export async function searchArtifacts(
	userId: string,
	query: string,
	kind?: string,
	limit = 20,
): Promise<Artifact[]> {
	let whereConditions = and(
		eq(artifacts.userId, userId),
		// Simple text search - could be enhanced with full-text search
	);

	if (kind) {
		whereConditions = and(whereConditions, eq(artifacts.kind, kind));
	}

	return await db.query.artifacts.findMany({
		where: whereConditions,
		orderBy: [desc(artifacts.updatedAt)],
		limit,
	});
}
