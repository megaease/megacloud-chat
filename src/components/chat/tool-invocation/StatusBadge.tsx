import {
	IconAlertCircle,
	IconCircleCheck,
	IconLoader,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { ToolStatus, ToolTheme } from "./types";

interface StatusBadgeProps {
	status: ToolStatus;
	theme: ToolTheme;
	className?: string;
}

export function StatusBadge({ status, theme, className }: StatusBadgeProps) {
	const getStatusIcon = () => {
		switch (status) {
			case "success":
				return <IconCircleCheck size={14} className="text-white" />;
			case "error":
				return <IconAlertCircle size={14} className="text-white" />;
			case "executing":
				return (
					<div className="animate-spin">
						<IconLoader size={14} className="text-white" />
					</div>
				);
			default:
				return <IconLoader size={14} className="text-white" />;
		}
	};

	const getStatusText = () => {
		switch (status) {
			case "success":
				return "Completed";
			case "error":
				return "Failed";
			case "executing":
				return "Executing...";
			default:
				return "Processing";
		}
	};

	return (
		<div
			className={cn(
				"flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all duration-200 border text-white",
				theme.badgeBackgroundColor,
				theme.badgeBorderColor,
				theme.badgeShadowColor,
				className,
			)}
		>
			{getStatusIcon()}
			<span className="font-medium">{getStatusText()}</span>
		</div>
	);
}
