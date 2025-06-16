import { useEffect, useState } from "react";

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
 * Hook to monitor MCP connection status in real-time
 * 通过 API 轮询获取状态，因为连接管理器在服务器端
 */
export function useMCPConnectionStatus() {
	const [connectionStates, setConnectionStates] = useState<MCPConnectionState>(
		{},
	);
	const [isLoading, setIsLoading] = useState(false);

	// 获取连接统计信息
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

	useEffect(() => {
		// 初始加载
		fetchConnectionStats();

		// 定期轮询状态 (每30秒)
		const interval = setInterval(fetchConnectionStats, 30000);

		return () => clearInterval(interval);
	}, []);

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

	// 手动刷新状态
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
