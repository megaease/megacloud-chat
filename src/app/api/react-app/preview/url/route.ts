// app/api/react-app/preview/url/route.ts
import { type NextRequest, NextResponse } from "next/server";
import {
	getSandbox,
	createSandbox,
	cleanupExistingSandbox,
	installDependencies,
	startDevServer,
	writeFilesToSandbox,
} from "@/lib/services/react-app-service";
import { getArtifactById } from "@/server/db/queries/artifacts";
import type { ReactAppContent } from "@/lib/artifact-types";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { userId, artifactId } = body;

		if (!userId || !artifactId) {
			return NextResponse.json(
				{ error: "UserId and artifactId are required" },
				{ status: 400 },
			);
		}

		let sandbox = getSandbox(userId, artifactId);

		// If sandbox doesn't exist, recreate the entire React app environment
		if (!sandbox) {
			console.log("Sandbox not found, recreating React app environment...");

			try {
				// Get the artifact content
				const artifact = await getArtifactById(artifactId, userId);
				if (!artifact) {
					return NextResponse.json(
						{ error: "Artifact not found" },
						{ status: 404 },
					);
				}

				// Parse the React app content
				const reactAppContent = JSON.parse(artifact.content) as ReactAppContent;
				if (!reactAppContent.files || reactAppContent.files.length === 0) {
					return NextResponse.json(
						{ error: "Invalid React app content" },
						{ status: 400 },
					);
				}

				// Clean up any existing sandbox for this user
				await cleanupExistingSandbox(userId);

				// Create new sandbox
				const { sandboxId, error: sandboxError } = await createSandbox(
					userId,
					artifactId,
				);
				if (sandboxError || !sandboxId) {
					return NextResponse.json(
						{ error: `Failed to create sandbox: ${sandboxError}` },
						{ status: 500 },
					);
				}

				sandbox = getSandbox(userId, artifactId);
				if (!sandbox) {
					return NextResponse.json(
						{ error: "Failed to get sandbox after creation" },
						{ status: 500 },
					);
				}

				// Write files to sandbox
				console.log("Writing files to sandbox...");
				const { error: writeError } = await writeFilesToSandbox(
					sandbox,
					reactAppContent.files,
				);
				if (writeError) {
					return NextResponse.json(
						{ error: `Failed to write files: ${writeError}` },
						{ status: 500 },
					);
				}

				// Install dependencies
				console.log("Installing dependencies...");
				const { error: installError } = await installDependencies(sandbox);
				if (installError) {
					return NextResponse.json(
						{ error: `Failed to install dependencies: ${installError}` },
						{ status: 500 },
					);
				}

				// Start dev server
				console.log("Starting dev server...");
				const { previewUrl: url, error: serverError } =
					await startDevServer(sandbox);
				if (serverError) {
					return NextResponse.json(
						{ error: `Failed to start dev server: ${serverError}` },
						{ status: 500 },
					);
				}

				const previewUrl = url?.startsWith("http") ? url : `https://${url}`;

				return NextResponse.json({
					success: true,
					previewUrl,
					message: "React app environment recreated successfully",
				});
			} catch (error) {
				console.error("Error recreating React app environment:", error);
				return NextResponse.json(
					{
						error: `Failed to recreate environment: ${error instanceof Error ? error.message : "Unknown error"}`,
					},
					{ status: 500 },
				);
			}
		}

		// If sandbox exists, try to get the preview URL
		try {
			const previewUrl = sandbox.getHost(5173);
			const fullPreviewUrl = previewUrl.startsWith("http")
				? previewUrl
				: `https://${previewUrl}`;

			return NextResponse.json({
				success: true,
				previewUrl: fullPreviewUrl,
				message: "Sandbox found and running",
			});
		} catch (error) {
			// Sandbox exists but dev server is not running, try to start it
			console.log("Dev server not running, starting it...");
			try {
				const { previewUrl: url, error: serverError } =
					await startDevServer(sandbox);
				if (serverError) {
					return NextResponse.json({
						success: false,
						error: `Failed to start dev server: ${serverError}`,
						sandboxExists: true,
						message: "Dev server failed to start",
					});
				}

				const previewUrl = url?.startsWith("http") ? url : `https://${url}`;

				return NextResponse.json({
					success: true,
					previewUrl,
					message: "Dev server started successfully",
				});
			} catch (startError) {
				return NextResponse.json({
					success: false,
					error: `Failed to start dev server: ${startError instanceof Error ? startError.message : "Unknown error"}`,
					sandboxExists: true,
					message: "Dev server failed to start",
				});
			}
		}
	} catch (error) {
		console.error("Preview URL API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
