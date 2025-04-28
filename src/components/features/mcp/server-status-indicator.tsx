import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type ServerStatus = "online" | "offline" | "error" | "connecting";

interface ServerStatusIndicatorProps {
	status: ServerStatus;
	className?: string;
}

export function ServerStatusIndicator({
	status,
	className,
}: ServerStatusIndicatorProps) {
	const statusConfig = {
		online: {
			color: "text-green-500",
			label: "Online",
		},
		offline: {
			color: "text-gray-400",
			label: "Offline",
		},
		error: {
			color: "text-red-500",
			label: "Error",
		},
		connecting: {
			color: "text-amber-500",
			label: "Connecting",
		},
	};

	const config = statusConfig[status];

	return (
		<div className={cn("flex items-center gap-1.5", className)}>
			<Circle className={cn("h-3 w-3 fill-current", config.color)} />
			<span className="text-sm font-medium">{config.label}</span>
		</div>
	);
}
