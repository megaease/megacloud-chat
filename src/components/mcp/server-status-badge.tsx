import { IconCircle, IconLoader2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { type ServerStatus, ServerStatusEnum } from "@/server/db/schema";
import { useMCPConnectionStatus } from "@/hooks/use-mcp-connection-status";

interface ServerStatusBadgeProps {
	status: ServerStatus;
	serverId?: number;
	className?: string;
	showLabel?: boolean;
	useRealTimeStatus?: boolean;
}

export function ServerStatusBadge({
	status,
	serverId,
	className,
	showLabel = true,
	useRealTimeStatus = false,
}: ServerStatusBadgeProps) {
	const { getConnectionStatus, isConnecting } = useMCPConnectionStatus();

	// 使用实时状态或数据库状态
	const realTimeStatus =
		useRealTimeStatus && serverId ? getConnectionStatus(serverId) : null;

	const displayStatus = realTimeStatus || status;
	const isLoadingState =
		useRealTimeStatus && serverId && isConnecting(serverId);

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
		// 新增连接管理器状态
		connected: {
			color: "text-green-500",
			bgColor: "bg-green-500",
			label: "Connected",
		},
		disconnected: {
			color: "text-gray-400",
			bgColor: "bg-gray-400",
			label: "Disconnected",
		},
		connecting_realtime: {
			color: "text-amber-500",
			bgColor: "bg-amber-500",
			label: "Connecting",
		},
		reconnecting: {
			color: "text-amber-500",
			bgColor: "bg-amber-500",
			label: "Reconnecting",
		},
		error_realtime: {
			color: "text-red-500",
			bgColor: "bg-red-500",
			label: "Error",
		},
	};

	const getStatusKey = (
		status: string | ServerStatus,
	): keyof typeof statusConfig => {
		// 如果是实时状态，需要映射到正确的键
		if (realTimeStatus) {
			switch (status) {
				case "connecting":
					return "connecting_realtime";
				case "error":
					return "error_realtime";
				default:
					return status as keyof typeof statusConfig;
			}
		}
		return status as keyof typeof statusConfig;
	};

	const config =
		statusConfig[getStatusKey(displayStatus)] ||
		statusConfig[ServerStatusEnum.OFFLINE];

	return (
		<div className={cn("flex items-center gap-1.5", className)}>
			{isLoadingState ? (
				<IconLoader2 className="h-3 w-3 animate-spin text-amber-500" />
			) : (
				<IconCircle className={cn("h-3 w-3 fill-current", config.color)} />
			)}
			{showLabel && <span className="text-sm font-medium">{config.label}</span>}
		</div>
	);
}
