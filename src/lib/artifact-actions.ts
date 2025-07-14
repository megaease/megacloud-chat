"use server";

import { getArtifactsByUserId } from "@/server/db/queries/artifacts";
import type { Artifact } from "@/server/db/schema";

// Mock function to get current user ID.
// In a real application, this would be replaced with actual authentication logic.
async function getCurrentUserId(): Promise<string> {
  // For now, returning a hardcoded user ID for demonstration purposes.
  // Fixed to match the actual user ID format used in the database
  return "user-id";
}

export async function getArtifacts(): Promise<{
  success: boolean;
  data?: Artifact[];
  error?: string;
}> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const artifacts = await getArtifactsByUserId(userId);

    return { success: true, data: artifacts };
  } catch (error) {
    console.error("Failed to fetch artifacts:", error);
    return { success: false, error: "Failed to fetch artifacts" };
  }
}