// lib/ai/tools/generate-react-app-tool.ts
import { z } from "zod";
import { getTemplate, getAllTemplates } from "@/lib/react-scaffold/templates";
import { getArtifactById, updateArtifact } from "@/server/db/queries/artifacts";
import type { ReactAppContent } from "@/lib/artifact-types";

// Input schema for generate react app tool
export const generateReactAppInputSchema = z.object({
	template: z.enum(["base-react", "tailwind-react", "router-react"]).describe("The template to use for the React app"),
	artifactId: z.string().describe("The ID of the artifact to update with generated files"),
	userId: z.string().describe("The user ID"),
	customComponent: z.string().optional().describe("Custom React component code to replace the default App component"),
});

export type GenerateReactAppInput = z.infer<typeof generateReactAppInputSchema>;

// Tool definition for AI SDK
export const generateReactAppTool = {
	name: "generateReactAppTool",
	description: "Generate a complete React app from a predefined template",
	parameters: {
		template: {
			type: "string",
			enum: ["base-react", "tailwind-react", "router-react"],
			description: "The template to use: base-react (basic), tailwind-react (with Tailwind CSS), router-react (with React Router)",
		},
		artifactId: {
			type: "string",
			description: "The ID of the artifact to update with generated files",
		},
		userId: {
			type: "string",
			description: "The user ID",
		},
		customComponent: {
			type: "string",
			description: "Optional custom React component code to replace the default App component",
			required: false,
		},
	},
};

// The actual generate react app function
export async function runGenerateReactAppTool({
	template,
	artifactId,
	userId,
	customComponent,
}: GenerateReactAppInput): Promise<{ success: boolean; files?: any[]; error?: string }> {
	try {
		console.log("Generating React app with template:", template);

		// Get the template
		const selectedTemplate = getTemplate(template);
		if (!selectedTemplate) {
			throw new Error(`Template '${template}' not found`);
		}

		// Get artifact to update
		const artifact = await getArtifactById(artifactId, userId);
		if (!artifact) {
			throw new Error("Artifact not found");
		}

		// Generate files from template
		let files = selectedTemplate.files.map(file => ({
			path: file.path,
			content: file.content,
			language: file.language,
		}));

		// If custom component is provided, replace the App component
		if (customComponent) {
			console.log("Replacing App component with custom component");
			const appFileIndex = files.findIndex(f => f.path === "src/App.tsx");
			if (appFileIndex !== -1) {
				files[appFileIndex] = {
					...files[appFileIndex],
					content: customComponent,
				};
			}
		}

		// Create the React app content
		const reactAppContent: ReactAppContent = {
			type: "react-app",
			files,
			config: {
				typescript: true,
				tailwind: template === "tailwind-react",
				router: template === "router-react",
			},
		};

		// Update the artifact
		await updateArtifact({
			artifactId,
			userId,
			content: JSON.stringify(reactAppContent),
			changeDescription: `Generated React app from ${template} template`,
		});

		console.log(`✓ Successfully generated React app with ${files.length} files`);

		return {
			success: true,
			files,
		};
	} catch (error) {
		console.error("Generate React app error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}

// Helper function to list available templates
export function listTemplates(): { name: string; description: string }[] {
	return getAllTemplates().map(template => ({
		name: template.name,
		description: template.description,
	}));
}