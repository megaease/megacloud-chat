import type { ArtifactLanguage } from "@/lib/artifact-types";

export interface PreviewState {
	viewMode: "code" | "preview";
	isExecuting: boolean;
	copyStatus: "idle" | "copied";
	htmlViewMode: "desktop" | "tablet" | "mobile";
	consoleOutput: string;
	consoleError: string;
	status: "idle" | "streaming" | "error" | "loading";
}

export interface ExecutionContext {
	isReady: boolean;
	isInitializing: boolean;
	progress: number;
	error: string | null;
}

export interface ExecutionResult {
	output: string;
	error: string | null;
	success: boolean;
}

export interface PreviewPlugin {
	type: string;
	name: string;
	component: React.ComponentType<PreviewProps>;
	supportedLanguages: ArtifactLanguage[];
	canExecute?: boolean;
	toolbarActions?: ToolbarAction[];
}

export interface ExecutionEngine {
	language: ArtifactLanguage;
	execute: (code: string) => Promise<ExecutionResult>;
	initialize?: () => Promise<void>;
	isReady: boolean;
}

export interface ToolbarAction {
	id: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	onClick: () => void;
	disabled?: boolean;
	variant?: "default" | "ghost" | "outline";
}

export interface PreviewProps {
	content: string;
	language: ArtifactLanguage;
	onExecute?: () => void;
	isExecuting?: boolean;
	className?: string;
}

export interface CodePreviewProps {
	content: string;
	language?: ArtifactLanguage;
	kind?: string;
	className?: string;
	status?: "idle" | "streaming" | "error" | "loading";
}
