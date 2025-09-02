// lib/ai/tools/start-dev-server-tool.ts
import { z } from "zod";
import { getSandbox } from "./create-sandbox-tool";
import { getArtifactById, updateArtifact } from "@/server/db/queries/artifacts";
import type { ReactAppContent } from "@/lib/artifact-types";

// Input schema for start dev server tool
export const startDevServerInputSchema = z.object({
	artifactId: z.string().describe("The ID of the React app artifact"),
	userId: z.string().describe("The user ID"),
	port: z.number().optional().default(5173).describe("Port to run the dev server on"),
});

export type StartDevServerInput = z.infer<typeof startDevServerInputSchema>;

// Tool definition for AI SDK
export const startDevServerTool = {
	name: "startDevServerTool",
	description: "Start the development server for a React app in the sandbox",
	parameters: {
		artifactId: {
			type: "string",
			description: "The ID of the React app artifact",
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

// The actual start dev server function
export async function runStartDevServerTool({
	artifactId,
	userId,
	port = 5173,
}: StartDevServerInput): Promise<{ success: boolean; url?: string; error?: string }> {
	try {
		console.log("Starting dev server for artifact:", artifactId);

		// Get existing sandbox
		const sandbox = getSandbox(userId, artifactId);
		if (!sandbox) {
			throw new Error("Sandbox not found. Please create a sandbox first.");
		}

		// Start dev server
		console.log("Starting dev server...");
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

		// Check if process is running
		const processes = await sandbox.commands.list();
		const isServerRunning = processes.some(p => p.cmd?.includes("npm run dev"));
		
		if (!isServerRunning) {
			throw new Error("Dev server failed to start");
		}

		// The sandbox will be accessible via the E2B domain
		const url = `https://${sandbox.sandboxId}.e2b.dev`;
		console.log("Preview URL:", url);

		// Update artifact with preview URL
		const artifact = await getArtifactById(artifactId, userId);
		if (artifact) {
			const reactAppContent = JSON.parse(artifact.content) as ReactAppContent;
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
		}

		return {
			success: true,
			url,
		};
	} catch (error) {
		console.error("Start dev server error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}