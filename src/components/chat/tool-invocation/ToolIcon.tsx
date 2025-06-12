import { IconDatabase, IconTerminal } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { ToolTheme } from "./types";

interface ToolIconProps {
	toolName: string;
	theme: ToolTheme;
	className?: string;
}

export function ToolIcon({ toolName, theme, className }: ToolIconProps) {
	const isDatabase =
		toolName.includes("sql") || toolName.includes("postgresql");

	const IconComponent = isDatabase ? IconDatabase : IconTerminal;

	return (
		<div
			className={cn(
				"flex items-center justify-center w-10 h-10 rounded-lg shadow-lg transition-all duration-300 group-hover:scale-105 text-white",
				theme.iconGradient,
				theme.iconShadowColor,
				className,
			)}
		>
			<IconComponent size={18} />
		</div>
	);
}
