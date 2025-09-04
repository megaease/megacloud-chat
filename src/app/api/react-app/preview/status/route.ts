import { getArtifactById } from "@/server/db/queries/artifacts";
import { getSandbox } from "@/lib/services/react-app-service";
import { type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  console.log("POST /api/react-app/preview/status");
  
  try {
    const { userId, artifactId } = await req.json();

    if (!userId || !artifactId) {
      return Response.json({ 
        success: false, 
        error: "User ID and artifact ID are required" 
      }, { status: 400 });
    }

    // Get artifact to verify ownership
    const artifact = await getArtifactById(artifactId, userId);
    if (!artifact) {
      return Response.json({ 
        success: false, 
        error: "Artifact not found" 
      }, { status: 404 });
    }

    // Check if sandbox exists and is running
    const sandbox = getSandbox(userId, artifactId);
    if (!sandbox) {
      return Response.json({
        success: true,
        sandboxExists: false,
        isRunning: false,
        previewUrl: null
      });
    }

    // Try to get the preview URL to check if the sandbox is running
    try {
      const previewUrl = sandbox.getHost(5173);
      return Response.json({
        success: true,
        sandboxExists: true,
        isRunning: true,
        previewUrl: previewUrl.startsWith("http") ? previewUrl : `https://${previewUrl}`
      });
    } catch (error) {
      return Response.json({
        success: true,
        sandboxExists: true,
        isRunning: false,
        previewUrl: null
      });
    }

  } catch (error) {
    console.error("Error checking sandbox status:", error);
    return Response.json({ 
      success: false, 
      error: "Failed to check sandbox status" 
    }, { status: 500 });
  }
}