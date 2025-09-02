// lib/ai/tools/install-dependencies-tool.ts
import { z } from "zod";
import { getSandbox } from "./create-sandbox-tool";

// Input schema for install dependencies tool
export const installDependenciesInputSchema = z.object({
	artifactId: z.string().describe("The ID of the React app artifact"),
	userId: z.string().describe("The user ID"),
});

export type InstallDependenciesInput = z.infer<typeof installDependenciesInputSchema>;

// Tool definition for AI SDK
export const installDependenciesTool = {
	name: "installDependenciesTool",
	description: "Install npm dependencies for a React app in the sandbox",
	parameters: {
		artifactId: {
			type: "string",
			description: "The ID of the React app artifact",
		},
		userId: {
			type: "string",
			description: "The user ID",
		},
	},
};

// The actual install dependencies function
export async function runInstallDependenciesTool({
	artifactId,
	userId,
}: InstallDependenciesInput): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		console.log("Installing dependencies for artifact:", artifactId);

		// Get existing sandbox
		const sandbox = getSandbox(userId, artifactId);
		if (!sandbox) {
			throw new Error("Sandbox not found. Please create a sandbox first.");
		}

		// Install dependencies
		const installResult = await sandbox.commands.run("npm install", {
			cwd: "/home/user",
			timeoutMs: 120000, // 2 minutes timeout
		});
		
		if (installResult.exitCode !== 0) {
			console.error("npm install failed:", installResult.stderr);
			throw new Error(`Failed to install dependencies: ${installResult.stderr}`);
		}

		console.log("✓ Dependencies installed successfully");

		return {
			success: true,
			message: "Dependencies installed successfully",
		};
	} catch (error) {
		console.error("Install dependencies error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}