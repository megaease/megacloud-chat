// lib/ai/tools/preview-react-app-tool.ts
import { Sandbox } from "@e2b/code-interpreter";
import { z } from "zod";
import { getArtifactById, updateArtifact } from "@/server/db/queries/artifacts";
import type { ReactAppContent } from "@/lib/artifact-types";

// Input schema for preview react app tool
export const previewReactAppInputSchema = z.object({
	artifactId: z.string().describe("The ID of the React app artifact to preview"),
	userId: z.string().describe("The user ID"),
	port: z.number().optional().default(5173).describe("Port to run the dev server on"),
});

export type PreviewReactAppInput = z.infer<typeof previewReactAppInputSchema>;

// Interface for preview result
export interface PreviewReactAppResult {
	success: boolean;
	url?: string;
	sandboxId?: string;
	error?: string;
	message?: string;
}

// Tool definition for AI SDK
export const previewReactAppTool = {
	name: "previewReactAppTool",
	description: "Start a preview server for a React app artifact using E2B sandbox",
	parameters: {
		artifactId: {
			type: "string",
			description: "The ID of the React app artifact to preview",
		},
		userId: {
			type: "string",
			description: "The user ID",
		},
		port: {
			type: "number",
			description: "Port to run the dev server on (default: 5173)",
			required: false,
		},
	},
};

// The actual preview function
export async function runPreviewReactAppTool({
	artifactId,
	userId,
	port = 5173,
}: PreviewReactAppInput): Promise<PreviewReactAppResult> {
	try {
		console.log("Starting React app preview for artifact:", artifactId);

		// Fetch the artifact data
		const artifact = await getArtifactById(artifactId, userId);
		
		if (!artifact) {
			throw new Error("Artifact not found");
		}

		if (artifact.kind !== "react-app") {
			throw new Error("Invalid artifact or not a React app");
		}

		// Parse the React app content
		const reactAppContent = JSON.parse(artifact.content) as ReactAppContent;
		
		if (!reactAppContent.files || !Array.isArray(reactAppContent.files)) {
			throw new Error("Invalid React app content structure");
		}

		// Create E2B sandbox
		console.log("Creating E2B sandbox...");
		const sandbox = await Sandbox.create({
			apiKey: process.env.E2B_API_KEY,
		});

		const sandboxId = sandbox.sandboxId;

		// Initialize project structure
		console.log("Setting up project files...");
		
		// Create package.json if not exists
		const packageJsonFile = reactAppContent.files.find(f => f.path === "package.json");
		if (!packageJsonFile) {
			throw new Error("package.json not found in React app files");
		}

		// Write all React app files
		for (const file of reactAppContent.files) {
			// Write file content using the files module
			// This will automatically create directories if they don't exist
			await sandbox.files.write(file.path, file.content);
		}

		// Install dependencies
		console.log("Installing dependencies...");
		const installResult = await sandbox.commands.run("npm install", {
			cwd: "/home/user",
			timeoutMs: 120000, // 2 minutes timeout
		});
		
		if (installResult.exitCode !== 0) {
			console.error("npm install failed:", installResult.stderr);
			throw new Error("Failed to install dependencies");
		}
		console.log("✓ Dependencies installed successfully");

		// Start dev server
		console.log("Starting dev server...");
		// Note: Starting dev server in background with commands API
		const devServerProcess = await sandbox.commands.run(
			`npm run dev -- --port ${port} --host 0.0.0.0`,
			{
				cwd: "/home/user",
				envs: {
					FORCE_COLOR: "0",
				},
				background: true,
			}
		);

		// Wait a bit for server to start
		await new Promise(resolve => setTimeout(resolve, 5000));

		// The sandbox will be accessible via the E2B domain
		// For code interpreter sandbox, we need to use the sandbox ID
		const url = `https://${sandboxId}.e2b.dev`;

		console.log("Preview URL:", url);

		// Update artifact with preview URL
		const updatedContent = {
			...reactAppContent,
			previewUrl: url,
		};

		await updateArtifact({
			artifactId,
			userId,
			content: JSON.stringify(updatedContent),
			changeDescription: "Added preview URL",
		});

		return {
			success: true,
			url,
			sandboxId: sandbox.sandboxId,
			message: `React app preview started at ${url}`,
		};
	} catch (error) {
		console.error("Preview error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}