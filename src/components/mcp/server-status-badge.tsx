import { IconCircle, IconLoader2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { type ServerStatus, ServerStatusEnum } from "@/server/db/schema";

interface ServerStatusBadgeProps {
	status: ServerStatus;
	className?: string;
	showLabel?: boolean;
	isLoading?: boolean;
}

export function ServerStatusBadge({
	status,
	className,
	showLabel = true,
	isLoading = false,
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

	const config = statusConfig[status] || statusConfig[ServerStatusEnum.OFFLINE];

	return (
		<div className={cn("flex items-center gap-1.5", className)}>
			{isLoading ? (
				<IconLoader2 className="h-3 w-3 animate-spin text-amber-500" />
			) : (
				<IconCircle className={cn("h-3 w-3 fill-current", config.color)} />
			)}
			{showLabel && <span className="text-sm font-medium">{config.label}</span>}
		</div>
	);
}
