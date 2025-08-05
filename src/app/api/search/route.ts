import { NextResponse } from "next/server";
import { searchChats } from "@/server/db/queries/chats";
import { z } from "zod";

// Validation schema for search request
const searchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(200, "Search query is too long"),
  limit: z.number().min(1).max(50).optional().default(20),
});

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const limit = searchParams.get("limit");

    // Validate request parameters
    const validatedData = searchSchema.parse({
      query,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    // Perform search
    const searchResults = await searchChats({
      userId,
      query: validatedData.query,
      limit: validatedData.limit,
    });

    return NextResponse.json({
      results: searchResults,
      query: validatedData.query,
      total: searchResults.length,
      success: true,
    });

  } catch (error) {
    console.error("Error performing search:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle known errors from searchChats function
    if (error instanceof Error) {
      if (error.message === "Search query is required") {
        return NextResponse.json(
          { error: "Search query is required" },
          { status: 400 }
        );
      }

      if (error.message === "User ID is required") {
        return NextResponse.json(
          { error: "User ID is required" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
