import { db } from "@/server/db";
import { apiProviders } from "@/server/db/schema";
import type { UpdateApiProviderData } from "@/types/api-provider";
import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const body = await request.json();
		const { id } = await params;
		const updates = body as UpdateApiProviderData;

		const [updatedProvider] = await db
			.update(apiProviders)
			.set({
				...updates,
				updatedAt: new Date(),
			})
			.where(eq(apiProviders.id, id))
			.returning();

		if (!updatedProvider) {
			return NextResponse.json(
				{ error: "Provider not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ provider: updatedProvider }, { status: 200 });
	} catch (error) {
		console.error("Error updating provider:", error);
		return NextResponse.json(
			{ error: "Failed to update provider" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		// Check if this is the default provider
		const provider = await db
			.select()
			.from(apiProviders)
			.where(eq(apiProviders.id, id))
			.limit(1);

		if (!provider || provider.length === 0) {
			return NextResponse.json(
				{ error: "Provider not found" },
				{ status: 404 },
			);
		}

		const currentProvider = provider[0];
		if (!currentProvider) {
			return NextResponse.json(
				{ error: "Provider not found" },
				{ status: 404 },
			);
		}

		// If deleting the default provider, set another one as default
		if (currentProvider.isDefault === 1) {
			const otherProviders = await db
				.select()
				.from(apiProviders)
				.where(
					and(
						eq(apiProviders.userId, currentProvider.userId),
						ne(apiProviders.id, id),
					),
				)
				.limit(1);

			if (otherProviders.length > 0 && otherProviders[0]) {
				await db
					.update(apiProviders)
					.set({ isDefault: 1 })
					.where(eq(apiProviders.id, otherProviders[0].id));
			}
		}

		await db.delete(apiProviders).where(eq(apiProviders.id, id));

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error("Error deleting provider:", error);
		return NextResponse.json(
			{ error: "Failed to delete provider" },
			{ status: 500 },
		);
	}
}
