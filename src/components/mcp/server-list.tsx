"use client";

import { useState, useEffect } from "react";
import {
	Edit,
	Trash,
	Server,
	MoreVertical,
	Power,
	PowerOff,
	Plus,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServerStatusBadge } from "@/components/mcp/server-status-badge";
import { ConnectionInfo } from "@/components/mcp/connection-info";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// import { EditServerDialog } from "@/components/mcp/edit-server-dialog";
import {
	getMcpServers,
	updateMcpServerStatus,
	deleteMcpServer,
} from "@/lib/mcp-server-action";
import {
	type McpServer,
	type Type,
	TypeEnum,
	ServerStatusEnum,
	type ServerStatus,
} from "@/server/db/schema";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
// import { MCPClientManager } from "@/lib/mcp-client";

interface ServersListProps {
	onAddServer?: () => void;
}

export function ServerList({ onAddServer }: ServersListProps) {
	const [serverToDelete, setServerToDelete] = useState<number | null>(null);
	const [serverToEdit, setServerToEdit] = useState<number | null>(null);
	const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>(
		{},
	);

	// Fetch servers on mount
	const { data: serversResult, isLoading } = useQuery({
		queryKey: ["getMcpServers"],
		queryFn: async () => {
			const servers = await getMcpServers();
			return servers;
		},
	});
	const servers = serversResult?.success
		? (serversResult.data as McpServer[])
		: [];
	// Function to toggle server connection
	const handleToggleServer = async (
		id: number,
		currentStatus: ServerStatus,
	) => {
		// Set loading state for this server
		setLoadingStates((prev) => ({ ...prev, [id]: true }));
	};

	// Function to delete a server
	const handleDeleteServer = async (id: number) => {};

	// Function to handle edit success
	const handleEditSuccess = (id: number, updatedData: any) => {
		setServerToEdit(null);
	};

	// Show loading state
	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<p className="mt-4 text-sm text-muted-foreground">加载服务器列表...</p>
			</div>
		);
	}

	// Show empty state
	if (servers.length === 0) {
		return (
			<div className="text-center py-12">
				<Server className="mx-auto h-12 w-12 text-gray-400" />
				<h3 className="mt-4 text-lg font-medium">未找到服务器</h3>
				<p className="mt-2 text-sm text-gray-500">
					添加一个新的 MCP 服务器开始使用。
				</p>
				<Button onClick={onAddServer} className="mt-4">
					<Plus className="mr-2 h-4 w-4" />
					添加服务器
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 gap-4">
				{servers.map((server) => (
					<Card key={server.id}>
						<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
							<div>
								<CardTitle className="text-base flex items-center">
									<Server className="mr-2 h-4 w-4" />
									{server.name}
								</CardTitle>
								<div className="text-sm text-muted-foreground mt-1">
									{server.description}
								</div>
							</div>
							<div className="flex items-center gap-2">
								<ServerStatusBadge status={server.status as any} />
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon">
											<MoreVertical className="h-4 w-4" />
											<span className="sr-only">打开菜单</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() =>
												handleToggleServer(server.id, server.status as any)
											}
										>
											{server.status === ServerStatusEnum.ONLINE ? (
												<>
													<PowerOff className="mr-2 h-4 w-4" />
													<span>断开连接</span>
												</>
											) : (
												<>
													<Power className="mr-2 h-4 w-4" />
													<span>连接</span>
												</>
											)}
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => setServerToEdit(server.id)}
										>
											<Edit className="mr-2 h-4 w-4" />
											<span>编辑</span>
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="text-red-600"
											onSelect={(e) => {
												e.preventDefault();
												setServerToDelete(server.id);
											}}
										>
											<Trash className="mr-2 h-4 w-4" />
											<span>删除</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">连接方式：</span>
									<ConnectionInfo
										connectionType={server.connectionType as ConnectionType}
									/>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">最后连接：</span>
									<span>
										{server.lastConnected
											? new Date(server.lastConnected).toLocaleString()
											: "从未"}
									</span>
								</div>
								<div className="mt-3 text-sm">
									<span className="text-muted-foreground">连接详情：</span>
									<code className="mt-1 block text-xs bg-slate-50 p-2 rounded border overflow-x-auto">
										{server.type === TypeEnum.SSE ? server.url : server.command}
									</code>
								</div>
								<div className="flex justify-end mt-3">
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											handleToggleServer(server.id, server.status as any)
										}
										disabled={
											loadingStates[server.id] ||
											server.status === ServerStatusEnum.CONNECTING
										}
									>
										{loadingStates[server.id] ||
										server.status === ServerStatusEnum.CONNECTING ? (
											<>
												<Loader2 className="mr-2 h-3 w-3 animate-spin" />
												{server.status === ServerStatusEnum.ONLINE
													? "断开中..."
													: "连接中..."}
											</>
										) : server.status === ServerStatusEnum.ONLINE ? (
											<>
												<PowerOff className="mr-2 h-3 w-3" />
												断开连接
											</>
										) : (
											<>
												<Power className="mr-2 h-3 w-3" />
												连接
											</>
										)}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<AlertDialog
				open={!!serverToDelete}
				onOpenChange={(open) => !open && setServerToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>确定要删除吗？</AlertDialogTitle>
						<AlertDialogDescription>
							这将永久删除 MCP 服务器及其所有配置。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>取消</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								serverToDelete && handleDeleteServer(serverToDelete)
							}
						>
							删除
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* {serverToEdit && (
				<EditServerDialog
					serverId={serverToEdit}
					open={!!serverToEdit}
					onOpenChange={(open) => !open && setServerToEdit(null)}
					onSuccess={(updatedData) =>
						handleEditSuccess(serverToEdit, updatedData)
					}
				/>
			)} */}
		</div>
	);
}
