import type {
	ToolInvocationPart as ToolInvocationPartType,
	ResultContent,
} from "@/types/tool-invocation";

export interface ToolInvocationProps {
	part: ToolInvocationPartType;
	isLoading: boolean;
	isCompact?: boolean; // 紧凑模式，用于 Artifact 侧边栏等窄屏场景
}

export interface ToolState {
	toolName: string;
	state: string;
	args: Record<string, unknown>;
	hasError: boolean;
	errorMessage: string | null;
	isSuccessful: boolean;
	isDocumentTool: boolean;
	result: Array<ResultContent | string> | string | null;
}

export interface ToolTheme {
	borderColor: string;
	backgroundColor: string;
	hoverShadowColor: string;
	hoverBackgroundColor: string;
	iconGradient: string;
	iconShadowColor: string;
	textColor: string;
	badgeBackgroundColor: string;
	badgeBorderColor: string;
	badgeShadowColor: string;
}

export type ToolStatus = "executing" | "success" | "error" | "idle";

export const TOOL_THEMES: Record<ToolStatus, ToolTheme> = {
	executing: {
		borderColor: "border-amber-200/70 dark:border-amber-800/40",
		backgroundColor:
			"bg-gradient-to-br from-amber-50/80 via-amber-50/40 to-white/60 dark:from-amber-950/30 dark:via-amber-950/15 dark:to-gray-900/60",
		hoverShadowColor: "hover:shadow-amber-200/30",
		hoverBackgroundColor: "hover:bg-amber-100/30 dark:hover:bg-amber-900/15",
		iconGradient: "bg-gradient-to-br from-amber-500 to-amber-600",
		iconShadowColor: "shadow-amber-500/30",
		textColor: "text-amber-800 dark:text-amber-200",
		badgeBackgroundColor: "bg-amber-500",
		badgeBorderColor: "border-amber-600",
		badgeShadowColor: "shadow-amber-500/20",
	},
	success: {
		borderColor: "border-blue-200/70 dark:border-blue-800/40",
		backgroundColor:
			"bg-gradient-to-br from-blue-50/80 via-blue-50/40 to-white/60 dark:from-blue-950/30 dark:via-blue-950/15 dark:to-gray-900/60",
		hoverShadowColor: "hover:shadow-blue-200/30",
		hoverBackgroundColor: "hover:bg-blue-100/30 dark:hover:bg-blue-900/15",
		iconGradient: "bg-gradient-to-br from-blue-500 to-blue-600",
		iconShadowColor: "shadow-blue-500/30",
		textColor: "text-blue-800 dark:text-blue-200",
		badgeBackgroundColor: "bg-blue-500",
		badgeBorderColor: "border-blue-600",
		badgeShadowColor: "shadow-blue-500/20",
	},
	error: {
		borderColor: "border-red-200/70 dark:border-red-800/40",
		backgroundColor:
			"bg-gradient-to-br from-red-50/80 via-red-50/40 to-white/60 dark:from-red-950/30 dark:via-red-950/15 dark:to-gray-900/60",
		hoverShadowColor: "hover:shadow-red-200/30",
		hoverBackgroundColor: "hover:bg-red-100/30 dark:hover:bg-red-900/15",
		iconGradient: "bg-gradient-to-br from-red-500 to-red-600",
		iconShadowColor: "shadow-red-500/30",
		textColor: "text-red-800 dark:text-red-200",
		badgeBackgroundColor: "bg-red-500",
		badgeBorderColor: "border-red-600",
		badgeShadowColor: "shadow-red-500/20",
	},
	idle: {
		borderColor: "border-gray-200/70 dark:border-gray-800/40",
		backgroundColor:
			"bg-gradient-to-br from-gray-50/80 via-gray-50/40 to-white/60 dark:from-gray-950/30 dark:via-gray-950/15 dark:to-gray-900/60",
		hoverShadowColor: "hover:shadow-gray-200/30",
		hoverBackgroundColor: "hover:bg-gray-100/30 dark:hover:bg-gray-900/15",
		iconGradient: "bg-gradient-to-br from-gray-500 to-gray-600",
		iconShadowColor: "shadow-gray-500/30",
		textColor: "text-gray-800 dark:text-gray-200",
		badgeBackgroundColor: "bg-gray-500",
		badgeBorderColor: "border-gray-600",
		badgeShadowColor: "shadow-gray-500/20",
	},
};
