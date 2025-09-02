// lib/ai/tools/write-files-tool.ts
import { z } from "zod";
import { getSandbox } from "./create-sandbox-tool";

// Input schema for write files tool
export const writeFilesInputSchema = z.object({
	artifactId: z.string().describe("The ID of the React app artifact"),
	userId: z.string().describe("The user ID"),
	files: z.array(z.object({
		path: z.string(),
		content: z.string(),
		language: z.enum(["json", "javascript", "typescript", "jsx", "tsx", "css", "html"]),
	})).describe("Files to write to the sandbox"),
});

export type WriteFilesInput = z.infer<typeof writeFilesInputSchema>;

// Tool definition for AI SDK
export const writeFilesTool = {
	name: "writeFilesTool",
	description: "Write React app files to the sandbox",
	parameters: {
		artifactId: {
			type: "string",
			description: "The ID of the React app artifact",
		},
		userId: {
			type: "string",
			description: "The user ID",
		},
		files: {
			type: "array",
			description: "Files to write to the sandbox",
			items: {
				type: "object",
				properties: {
					path: {
						type: "string",
						description: "File path",
					},
					content: {
						type: "string",
						description: "File content",
					},
					language: {
						type: "string",
						enum: ["json", "javascript", "typescript", "jsx", "tsx", "css", "html"],
						description: "File language/type",
					},
				},
				required: ["path", "content", "language"],
			},
		},
	},
};

// The actual write files function
export async function runWriteFilesTool({
	artifactId,
	userId,
	files,
}: WriteFilesInput): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		console.log("Writing files for artifact:", artifactId);

		// Get existing sandbox
		const sandbox = getSandbox(userId, artifactId);
		if (!sandbox) {
			throw new Error("Sandbox not found. Please create a sandbox first.");
		}

		// Write all files
		for (const file of files) {
			console.log(`Writing file: ${file.path}`);
			await sandbox.files.write(file.path, file.content);
		}

		console.log(`✓ Successfully wrote ${files.length} files`);

		return {
			success: true,
			message: `Successfully wrote ${files.length} files to sandbox`,
		};
	} catch (error) {
		console.error("Write files error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}