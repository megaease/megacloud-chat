import { Badge } from "@/components/ui/badge";
import {
	type Type as ConnectionType,
	TypeEnum as ConnectionTypeEnum,
} from "@/server/db/schema";

interface ConnectionInfoProps {
	connectionType: ConnectionType;
	className?: string;
}

export function ConnectionInfo({
	connectionType,
	className,
}: ConnectionInfoProps) {
	const connectionInfo = {
		[ConnectionTypeEnum.SSE]: {
			name: "SSE",
			description: "Server-Sent Events",
			color: "bg-blue-100 text-blue-800 hover:bg-blue-100",
		},
		[ConnectionTypeEnum.STDIO]: {
			name: "STDIO",
			description: "Standard Input/Output",
			color: "bg-purple-100 text-purple-800 hover:bg-purple-100",
		},
	};

	return (
		<div className={className}>
			<Badge variant="outline" className={connectionInfo[connectionType].color}>
				{connectionInfo[connectionType].name}
			</Badge>
			<span className="text-xs text-muted-foreground ml-2">
				{connectionInfo[connectionType].description}
			</span>
		</div>
	);
}
