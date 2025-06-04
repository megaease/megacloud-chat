import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { apiProviders } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import type { CreateApiProviderData } from "@/types/api-provider";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 },
			);
		}

		const providers = await db
			.select()
			.from(apiProviders)
			.where(eq(apiProviders.userId, userId))
			.orderBy(apiProviders.isDefault, apiProviders.createdAt);

		return NextResponse.json({ providers }, { status: 200 });
	} catch (error) {
		console.error("Error fetching providers:", error);
		return NextResponse.json(
			{ error: "Failed to fetch providers" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { name, providerType, apiKey, baseUrl, userId, availableModels } =
			body as CreateApiProviderData;

		if (!name || !providerType || !apiKey || !baseUrl || !userId) {
			return NextResponse.json(
				{ error: "All fields are required" },
				{ status: 400 },
			);
		}

		// Check if this is the first provider for this user
		const existingProviders = await db
			.select()
			.from(apiProviders)
			.where(eq(apiProviders.userId, userId));

		const isFirstProvider = existingProviders.length === 0;

		// Insert new provider
		const [newProvider] = await db
			.insert(apiProviders)
			.values({
				name,
				providerType,
				apiKey,
				baseUrl,
				userId,
				isDefault: isFirstProvider ? 1 : 0,
				availableModels: availableModels || [],
			})
			.returning();

		return NextResponse.json({ provider: newProvider }, { status: 201 });
	} catch (error) {
		console.error("Error creating provider:", error);
		return NextResponse.json(
			{ error: "Failed to create provider" },
			{ status: 500 },
		);
	}
}
