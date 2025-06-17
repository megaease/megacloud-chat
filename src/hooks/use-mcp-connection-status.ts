import { useState } from "react";

export type ConnectionStatus =
	| "disconnected"
	| "connecting"
	| "connected"
	| "error"
	| "reconnecting";

interface MCPConnectionState {
	[serverId: number]: ConnectionStatus;
}

/**
 * Simplified hook for MCP connection status
 * No longer polls automatically - database status is the source of truth
 * Kept for potential future use or manual status checking
 */
export function useMCPConnectionStatus() {
	const [connectionStates, setConnectionStates] = useState<MCPConnectionState>(
		{},
	);
	const [isLoading, setIsLoading] = useState(false);

	// Manual fetch function (no automatic polling)
	const fetchConnectionStats = async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/api/mcp/stats");
			if (response.ok) {
				const result = await response.json();
				if (result.success && result.data) {
					const newStates: MCPConnectionState = {};
					for (const connection of result.data.connections) {
						newStates[connection.serverId] = connection.status;
					}
					setConnectionStates(newStates);
				}
			}
		} catch (error) {
			console.error("Failed to fetch MCP connection stats:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const getConnectionStatus = (serverId: number): ConnectionStatus => {
		return connectionStates[serverId] || "disconnected";
	};

	const isConnected = (serverId: number): boolean => {
		return connectionStates[serverId] === "connected";
	};

	const isConnecting = (serverId: number): boolean => {
		const status = connectionStates[serverId];
		return status === "connecting" || status === "reconnecting";
	};

	const hasError = (serverId: number): boolean => {
		return connectionStates[serverId] === "error";
	};

	// Manual refresh function (no automatic polling)
	const refreshStatus = () => {
		fetchConnectionStats();
	};

	return {
		connectionStates,
		getConnectionStatus,
		isConnected,
		isConnecting,
		hasError,
		isLoading,
		refreshStatus,
	};
}
