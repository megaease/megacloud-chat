// lib/ai/tools/create-react-app-tool.ts
import { z } from "zod";
import { createReactApp } from "@/lib/services/react-app-service";

// Input schema for create react app tool
export const createReactAppInputSchema = z.object({
	title: z.string().describe("The title of the React application (e.g., 'Todo App', 'Weather Dashboard')"),
	kind: z.literal("react-app").default("react-app").describe("The type of artifact to create - always 'react-app' for React applications"),
	customComponent: z.string().optional().describe("Custom React component code to replace the default App component. Should be a complete React component with export default statement."),
	autoStart: z.boolean().default(true).describe("Whether to automatically start the development server for preview"),
});

export type CreateReactAppInput = z.infer<typeof createReactAppInputSchema>;

// Tool definition for AI SDK
export const createReactAppTool = {
	name: "createReactAppTool",
	description: "Create a complete React application with automatic setup and preview. This tool handles everything: creating the artifact, generating the app structure, setting up a sandbox, writing files, installing dependencies, and starting the development server.",
	parameters: {
		title: {
			type: "string",
			description: "The title of the React application (e.g., 'Todo App', 'Weather Dashboard')",
		},
		kind: {
			type: "string",
			description: "The type of artifact to create - always 'react-app' for React applications",
			enum: ["react-app"],
			default: "react-app",
		},
		customComponent: {
			type: "string",
			description: "Optional custom React component code that will replace the default App component. Should be a complete React component with export default statement.",
			required: false,
		},
		autoStart: {
			type: "boolean",
			description: "Whether to automatically start the development server for preview",
			default: true,
		},
	},
};

// The actual create react app function
export async function runCreateReactAppTool({
	title,
	customComponent,
	autoStart,
	session,
	experimental_context,
}: CreateReactAppInput & { 
	session: { user: { id: string } };
	experimental_context?: { chatId: string };
}): Promise<{ 
	success: boolean; 
	artifactId?: string; 
	previewUrl?: string;
	error?: string;
	message?: string;
}> {
	console.log("runCreateReactAppTool called with:", { title, customComponent: !!customComponent, autoStart, experimental_context });
	
	if (!experimental_context?.chatId) {
		return {
			success: false,
			error: "Chat ID is required but not provided in context",
		};
	}
	
	const result = await createReactApp({
		title,
		userId: session.user.id,
		chatId: experimental_context.chatId,
		customComponent,
		autoStart,
	});
	
	return result;
}