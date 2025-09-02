// lib/ai/tools/create-sandbox-tool.ts
import { Sandbox } from "@e2b/code-interpreter";
import { z } from "zod";

// Input schema for create sandbox tool
export const createSandboxInputSchema = z.object({
	artifactId: z.string().describe("The ID of the artifact this sandbox is for"),
	userId: z.string().describe("The user ID"),
});

export type CreateSandboxInput = z.infer<typeof createSandboxInputSchema>;

// Interface for sandbox info
export interface SandboxInfo {
	sandboxId: string;
	status: "creating" | "ready" | "error";
	error?: string;
}

// Tool definition for AI SDK
export const createSandboxTool = {
	name: "createSandboxTool",
	description: "Create a new E2B sandbox for React app development",
	parameters: {
		artifactId: {
			type: "string",
			description: "The ID of the artifact this sandbox is for",
		},
		userId: {
			type: "string",
			description: "The user ID",
		},
	},
};

// Store active sandboxes (in production, this would be in a database)
const activeSandboxes = new Map<string, Sandbox>();

// The actual create sandbox function
export async function runCreateSandboxTool({
	artifactId,
	userId,
}: CreateSandboxInput): Promise<{ success: boolean; sandboxId?: string; error?: string }> {
	try {
		console.log("Creating sandbox for artifact:", artifactId);

		// Create E2B sandbox
		const sandbox = await Sandbox.create({
			apiKey: process.env.E2B_API_KEY,
		});

		const sandboxId = sandbox.sandboxId;
		
		// Store sandbox for later use
		activeSandboxes.set(`${userId}-${artifactId}`, sandbox);

		console.log("Sandbox created:", sandboxId);

		return {
			success: true,
			sandboxId,
		};
	} catch (error) {
		console.error("Sandbox creation error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}

// Helper function to get existing sandbox
export function getSandbox(userId: string, artifactId: string): Sandbox | undefined {
	return activeSandboxes.get(`${userId}-${artifactId}`);
}

// Helper function to close sandbox
export async function closeSandbox(userId: string, artifactId: string): Promise<boolean> {
	try {
		const sandbox = activeSandboxes.get(`${userId}-${artifactId}`);
		if (sandbox) {
			await sandbox.close();
			activeSandboxes.delete(`${userId}-${artifactId}`);
			return true;
		}
		return false;
	} catch (error) {
		console.error("Error closing sandbox:", error);
		return false;
	}
}