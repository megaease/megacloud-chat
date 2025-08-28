import { db } from "@/server/db";
import { apiProviders } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		// First verify provider exists
		const [provider] = await db
			.select()
			.from(apiProviders)
			.where(eq(apiProviders.id, id))
			.limit(1);

		if (!provider) {
			return NextResponse.json(
				{ error: "Provider not found" },
				{ status: 404 },
			);
		}

		// Reset all providers for this user to non-default
		await db
			.update(apiProviders)
			.set({ isDefault: 0 })
			.where(eq(apiProviders.userId, provider.userId));

		// Set the selected provider as default
		const [updatedProvider] = await db
			.update(apiProviders)
			.set({ isDefault: 1 })
			.where(eq(apiProviders.id, id))
			.returning();

		return NextResponse.json({ provider: updatedProvider }, { status: 200 });
	} catch (error) {
		console.error("Error setting default provider:", error);
		return NextResponse.json(
			{ error: "Failed to set default provider" },
			{ status: 500 },
		);
	}
}
