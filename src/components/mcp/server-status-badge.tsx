import { IconCircle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { type ServerStatus, ServerStatusEnum } from "@/server/db/schema";

interface ServerStatusBadgeProps {
	status: ServerStatus;
	className?: string;
	showLabel?: boolean;
}

export function ServerStatusBadge({
	status,
	className,
	showLabel = true,
}: ServerStatusBadgeProps) {
	const statusConfig = {
		[ServerStatusEnum.ONLINE]: {
			color: "text-green-500",
			bgColor: "bg-green-500",
			label: "Online",
		},
		[ServerStatusEnum.OFFLINE]: {
			color: "text-gray-400",
			bgColor: "bg-gray-400",
			label: "Offline",
		},
		[ServerStatusEnum.ERROR]: {
			color: "text-red-500",
			bgColor: "bg-red-500",
			label: "Error",
		},
		[ServerStatusEnum.CONNECTING]: {
			color: "text-amber-500",
			bgColor: "bg-amber-500",
			label: "Connecting",
		},
	};

	const config = statusConfig[status];

	return (
		<div className={cn("flex items-center gap-1.5", className)}>
			<IconCircle className={cn("h-3 w-3 fill-current", config.color)} />
			{showLabel && <span className="text-sm font-medium">{config.label}</span>}
		</div>
	);
}
