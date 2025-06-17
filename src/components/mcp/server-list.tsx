"use client";

import { useState, useEffect } from "react";
import {
	IconEdit,
	IconTrash,
	IconServer,
	IconDots,
	IconPower,
	IconCircleOff,
	IconPlus,
	IconLoader2,
} from "@tabler/icons-react";
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
import { EditServerDialog } from "@/components/mcp/edit-server-dialog";
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
	const {
		data: serversResult,
		isLoading,
		refetch,
	} = useQuery({
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
		try {
			const isOnline = currentStatus === ServerStatusEnum.ONLINE;
			const action = isOnline ? "stop" : "start";

			// Call the appropriate API endpoint to actually start/stop the server
			const response = await fetch(`/api/mcp/${id}/${action}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const result = await response.json();

			if (result.success) {
				toast.success(
					result.message ||
						`Server ${isOnline ? "stopped" : "started"} successfully`,
				);
			} else {
				toast.error(result.error || "Operation failed, please try again");
			}
		} catch (error) {
			toast.error("Operation failed, please try again");
		} finally {
			setLoadingStates((prev) => ({ ...prev, [id]: false }));
			// Refetch to get updated server list
			await refetch();
		}
	};

	// Function to delete a server
	const handleDeleteServer = async (id: number) => {
		if (!id) return;
		try {
			const result = await deleteMcpServer(id);
			if (result.success) {
				toast.success("Server deleted successfully");
			} else {
				toast.error("Failed to delete server");
			}
		} catch (error) {
			toast.error("Failed to delete server");
		} finally {
			setServerToDelete(null);
			refetch();
		}
	};

	// Show loading state
	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<IconLoader2 className="h-8 w-8 animate-spin text-primary" />
				<p className="mt-4 text-sm text-muted-foreground">
					Loading server list...
				</p>
			</div>
		);
	}

	// Show empty state
	if (servers.length === 0) {
		return (
			<div className="text-center py-12">
				<IconServer className="mx-auto h-12 w-12 text-gray-400" />
				<h3 className="mt-4 text-lg font-medium">No servers found</h3>
				<p className="mt-2 text-sm text-gray-500">
					Add a new MCP server to get started.
				</p>
				<Button onClick={onAddServer} className="mt-4">
					<IconPlus className="mr-2 h-4 w-4" />
					Add Server
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
									<IconServer className="mr-2 h-4 w-4" />
									{server.name}
								</CardTitle>
								<div className="text-sm text-muted-foreground mt-1">
									{server.description}
								</div>
							</div>
							<div className="flex items-center gap-2">
								<ServerStatusBadge
									status={server.status as ServerStatus}
									isLoading={loadingStates[server.id]}
								/>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon">
											<IconDots className="h-4 w-4" />
											<span className="sr-only">Open menu</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() =>
												handleToggleServer(
													server.id,
													server.status as ServerStatus,
												)
											}
										>
											{server.status === ServerStatusEnum.ONLINE ? (
												<>
													<IconCircleOff className="mr-2 h-4 w-4" />
													<span>Disable</span>
												</>
											) : (
												<>
													<IconPower className="mr-2 h-4 w-4" />
													<span>Enable</span>
												</>
											)}
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => setServerToEdit(server.id)}
										>
											<IconEdit className="mr-2 h-4 w-4" />
											<span>Edit</span>
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="text-red-600"
											onSelect={(e) => {
												e.preventDefault();
												setServerToDelete(server.id);
											}}
										>
											<IconTrash className="mr-2 h-4 w-4" />
											<span>Delete</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">
										Connection Type:
									</span>
									<ConnectionInfo connectionType={server.type as Type} />
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Last Connected:</span>
									<span>
										{server.lastConnected
											? new Date(server.lastConnected).toLocaleString()
											: "Never"}
									</span>
								</div>
								<div className="mt-3 text-sm">
									<span className="text-muted-foreground">
										Connection Details:
									</span>
									<code className="mt-1 block text-xs bg-slate-50 p-2 rounded border overflow-x-auto dark:bg-slate-800 dark:text-slate-200">
										{server.type === TypeEnum.SSE
											? server.url
											: `${server.command} ${server?.args?.join(" ") || ""}`}
									</code>
								</div>
								<div className="flex justify-end mt-3">
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											handleToggleServer(
												server.id,
												server.status as ServerStatus,
											)
										}
										disabled={
											loadingStates[server.id] ||
											server.status === ServerStatusEnum.CONNECTING
										}
									>
										{loadingStates[server.id] ||
										server.status === ServerStatusEnum.CONNECTING ? (
											<>
												<IconLoader2 className="mr-2 h-3 w-3 animate-spin" />
												{server.status === ServerStatusEnum.ONLINE
													? "Disconnecting..."
													: "Connecting..."}
											</>
										) : server.status === ServerStatusEnum.ONLINE ? (
											<>
												<IconCircleOff className="mr-2 h-3 w-3" />
												Disable
											</>
										) : (
											<>
												<IconPower className="mr-2 h-3 w-3" />
												Enable
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
						<AlertDialogTitle>
							Are you sure you want to delete?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete the MCP server and all its settings.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								serverToDelete && handleDeleteServer(serverToDelete)
							}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{serverToEdit && (
				<EditServerDialog
					serverId={serverToEdit}
					open={!!serverToEdit}
					onOpenChange={(open) => !open && setServerToEdit(null)}
					onSuccess={() => {
						setServerToEdit(null);
						refetch();
					}}
				/>
			)}
		</div>
	);
}
