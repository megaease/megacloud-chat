"use client";

import { useState } from "react";
import {
	IconServer,
	IconPower,
	IconCircleOff,
	IconLoader2,
	IconSettings,
	IconPlus,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMcpServers, updateMcpServerStatus } from "@/lib/mcp-server-action";
import { useMCPDrawer } from "@/context/mcp-drawer-context";
import { AddServerDialog } from "./add-server-dialog";
import {
	type McpServer,
	ServerStatusEnum,
	type ServerStatus,
} from "@/server/db/schema";
import { toast } from "sonner";
import { MCPDrawer } from "./mcp-drawer";

interface MCPToggleProps {
	mcpEnabled: boolean;
	toggleMcpEnabled: () => boolean;
	className?: string;
}

export function MCPToggle({
	mcpEnabled,
	toggleMcpEnabled,
	className,
}: MCPToggleProps) {
	const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>(
		{},
	);
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const queryClient = useQueryClient();
	const { openDrawer } = useMCPDrawer();

	// Fetch servers
	const { data: serversResult, refetch } = useQuery({
		queryKey: ["getMcpServers"],
		queryFn: async () => {
			const servers = await getMcpServers();
			return servers;
		},
	});

	const servers = serversResult?.success
		? (serversResult.data as McpServer[])
		: [];

	const onlineServers = servers.filter(
		(server) => server.status === ServerStatusEnum.ONLINE,
	);

	// Toggle server status
	const handleToggleServer = async (
		id: number,
		currentStatus: ServerStatus,
	) => {
		setLoadingStates((prev) => ({ ...prev, [id]: true }));
		try {
			const newStatus =
				currentStatus === ServerStatusEnum.ONLINE
					? ServerStatusEnum.OFFLINE
					: ServerStatusEnum.ONLINE;

			const result = await updateMcpServerStatus(id, newStatus);
			if (result.success) {
				toast.success(
					`Server ${newStatus === ServerStatusEnum.ONLINE ? "enabled" : "disabled"} successfully`,
				);
				refetch();
				queryClient.invalidateQueries({ queryKey: ["getMcpServers"] });
			} else {
				toast.error("Operation failed, please try again");
			}
		} catch (error) {
			console.error("Failed to toggle server:", error);
			toast.error("Operation failed, please try again");
		} finally {
			setLoadingStates((prev) => ({ ...prev, [id]: false }));
		}
	};

	return (
		<TooltipProvider>
			<div
				className={cn(
					"relative flex items-center rounded-lg shadow-sm border border-gray-200/60 dark:border-gray-700/60 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-md transition-all duration-200 m-1",
					className,
				)}
			>
				<DropdownMenu>
					<Tooltip delayDuration={300}>
						<TooltipTrigger asChild>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-auto px-3 pr-4 rounded-l-lg rounded-r-none bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/80 dark:to-slate-800/80 border-0 hover:from-gray-100 hover:to-slate-100 dark:hover:from-gray-700/80 dark:hover:to-slate-700/80 focus:outline-none transition-all duration-200 relative"
								>
									<div className="relative flex items-center gap-2.5">
										<IconServer
											className={cn(
												"h-4 w-4 transition-colors",
												mcpEnabled
													? "text-gray-700 dark:text-gray-200"
													: "text-gray-400 dark:text-gray-500",
											)}
										/>
										<span className="font-medium text-gray-700 dark:text-gray-200">
											MCP
										</span>
									</div>

									{/* Badge positioned outside the text area */}
									{onlineServers.length > 0 && mcpEnabled && (
										<div className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-gradient-to-r from-gray-600 to-slate-600 dark:from-gray-300 dark:to-slate-300 text-white dark:text-gray-800 text-xs font-bold flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-lg z-10">
											{onlineServers.length > 9 ? "9+" : onlineServers.length}
										</div>
									)}

									{/* Separator line */}
									<div className="absolute right-0 top-1 bottom-1 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
								</Button>
							</DropdownMenuTrigger>
						</TooltipTrigger>
						<TooltipContent side="top">
							<p>
								{mcpEnabled
									? `MCP: ${onlineServers.length > 0 ? `${onlineServers.length} active` : "enabled"}`
									: "MCP: disabled"}
							</p>
						</TooltipContent>
					</Tooltip>
					<DropdownMenuContent
						align="start"
						side="top"
						className="w-72 p-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-gray-200/60 dark:border-gray-700/60 shadow-lg"
						onCloseAutoFocus={(e) => e.preventDefault()}
					>
						{/* MCP Global Toggle */}
						<div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/80 dark:bg-gray-900/50  border border-gray-100/50 dark:border-gray-800/50">
							<div className="flex items-center gap-2.5">
								<IconServer className="h-4 w-4 text-gray-600 dark:text-gray-400" />
								<div className="flex flex-col">
									<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
										MCP
									</span>
									{mcpEnabled && onlineServers.length > 0 && (
										<span className="text-xs text-green-600 dark:text-green-400">
											{onlineServers.length} server
											{onlineServers.length !== 1 ? "s" : ""} active
										</span>
									)}
								</div>
							</div>
							<Switch
								checked={mcpEnabled}
								onCheckedChange={(checked) => {
									toggleMcpEnabled();
								}}
								className="data-[state=checked]:bg-primary"
							/>
						</div>

						{mcpEnabled && (
							<>
								<div className="flex items-center justify-between my-3">
									<div className="flex items-center gap-2">
										<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
											Servers
										</span>
										{onlineServers.length > 0 && (
											<Badge
												variant="secondary"
												className="h-5 px-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
											>
												{onlineServers.length} active
											</Badge>
										)}
									</div>
									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.preventDefault();
												setAddDialogOpen(true);
											}}
											className="h-7 w-7 p-0 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
											aria-label="Add server"
										>
											<IconPlus className="h-3.5 w-3.5" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.preventDefault();
												openDrawer();
											}}
											className="h-7 w-7 p-0 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
											aria-label="Server settings"
										>
											<IconSettings className="h-3.5 w-3.5" />
										</Button>
									</div>
								</div>

								<div className="space-y-1 max-h-48 overflow-y-auto">
									{servers.length === 0 ? (
										<div className="text-center py-6">
											<IconServer className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
											<p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
												No servers configured
											</p>
											<Button
												variant="outline"
												size="sm"
												onClick={(e) => {
													e.preventDefault();
													setAddDialogOpen(true);
												}}
												className="h-7 text-xs px-3 rounded-md"
											>
												Add Server
											</Button>
										</div>
									) : (
										servers.map((server) => (
											<div
												key={server.id}
												className="flex items-center justify-between p-2.5 rounded-md bg-gray-50/80 dark:bg-gray-900/50 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 transition-all duration-150 group"
											>
												<div className="flex items-center gap-2.5 flex-1 min-w-0">
													<div
														className={cn(
															"h-2 w-2 rounded-full transition-colors",
															server.status === ServerStatusEnum.ONLINE
																? "bg-green-500 shadow-sm shadow-green-500/30"
																: "bg-gray-300 dark:bg-gray-600",
														)}
													/>
													<div className="flex flex-col min-w-0 flex-1">
														<span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
															{server.name}
														</span>
														<span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
															{server.type}
														</span>
													</div>
												</div>
												<Button
													variant="ghost"
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														e.preventDefault();
														handleToggleServer(
															server.id,
															server.status as ServerStatus,
														);
													}}
													disabled={loadingStates[server.id]}
													className="h-7 w-7 p-0 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
													aria-label={`Toggle ${server.name}`}
												>
													{loadingStates[server.id] ? (
														<IconLoader2 className="h-3.5 w-3.5 animate-spin text-gray-500" />
													) : server.status === ServerStatusEnum.ONLINE ? (
														<IconPower className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
													) : (
														<IconCircleOff className="h-3.5 w-3.5 text-gray-400" />
													)}
												</Button>
											</div>
										))
									)}
								</div>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Add Server Button */}
				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setAddDialogOpen(true)}
							className="h-8 w-8 p-0 rounded-r-lg rounded-l-none bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-700/60 dark:to-slate-700/60 border-0 hover:from-gray-200 hover:to-slate-200 dark:hover:from-gray-600/60 dark:hover:to-slate-600/60 focus:outline-none transition-all duration-200 group"
						>
							<IconPlus className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-all duration-200 group-hover:scale-110 transform" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top">
						<p className="flex items-center gap-1.5">
							<IconPlus className="h-3 w-3" />
							Add MCP Server
						</p>
					</TooltipContent>
				</Tooltip>

				{/* Add Server Dialog */}
				<AddServerDialog
					open={addDialogOpen}
					onOpenChange={setAddDialogOpen}
					onSuccess={() => {
						refetch();
						queryClient.invalidateQueries({ queryKey: ["getMcpServers"] });
						toast.success("Server added successfully");
					}}
					customTrigger
				/>

				{/* MCP Drawer */}
				<MCPDrawer />
			</div>
		</TooltipProvider>
	);
}
