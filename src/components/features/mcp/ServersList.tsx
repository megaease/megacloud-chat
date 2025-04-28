"use client";

import { useState } from "react";
import Link from "next/link";
import {
	Edit,
	Trash,
	Server,
	MoreVertical,
	Power,
	PowerOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServerStatusIndicator } from "./server-status-indicator";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
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
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Mock data for demonstration
const mockServers = [
	{
		id: "1",
		name: "Neon Database",
		type: "database",
		url: "https://mcp.neon.tech/sse",
		status: "online",
		lastConnected: "2025-04-24T15:30:00Z",
		description: "Neon Postgres database MCP server",
	},
	{
		id: "2",
		name: "Supabase",
		type: "database",
		url: "npx -y @supabase/mcp-server-supabase@latest",
		status: "offline",
		lastConnected: "2025-04-23T10:15:00Z",
		description: "Supabase database and authentication MCP server",
	},
	{
		id: "3",
		name: "Custom API",
		type: "api",
		url: "http://localhost:3001/mcp",
		status: "error",
		lastConnected: "2025-04-22T08:45:00Z",
		description: "Custom API for product data",
	},
];

export function ServersList() {
	const [servers, setServers] = useState(mockServers);
	const [serverToDelete, setServerToDelete] = useState<string | null>(null);

	const handleDeleteServer = (id: string) => {
		setServers(servers.filter((server) => server.id !== id));
		setServerToDelete(null);
	};

	const handleToggleServer = (id: string) => {
		setServers(
			servers.map((server) =>
				server.id === id
					? {
							...server,
							status: server.status === "online" ? "offline" : "online",
						}
					: server,
			),
		);
	};

	if (servers.length === 0) {
		return (
			<div className="text-center py-12">
				<Server className="mx-auto h-12 w-12 text-gray-400" />
				<h3 className="mt-4 text-lg font-medium">No servers found</h3>
				<p className="mt-2 text-sm text-gray-500">
					Get started by adding a new MCP server.
				</p>
				<Link href="/mcp/add" className="mt-4 inline-block">
					<Button>Add Server</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 px">
			{servers.map((server) => (
				<Card key={server.id} className="overflow-hidden">
					<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
						<div>
							<CardTitle className="flex items-center">
								<Server className="mr-2 h-5 w-5" />
								{server.name}
							</CardTitle>
							<CardDescription>{server.description}</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<ServerStatusIndicator status={server.status as any} />
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon">
										<MoreVertical className="h-4 w-4" />
										<span className="sr-only">Open menu</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuLabel>Actions</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => handleToggleServer(server.id)}
									>
										{server.status === "online" ? (
											<>
												<PowerOff className="mr-2 h-4 w-4" />
												<span>Disconnect</span>
											</>
										) : (
											<>
												<Power className="mr-2 h-4 w-4" />
												<span>Connect</span>
											</>
										)}
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link href={`/mcp/edit/${server.id}`}>
											<Edit className="mr-2 h-4 w-4" />
											<span>Edit</span>
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<AlertDialog
										open={serverToDelete === server.id}
										onOpenChange={(open) => !open && setServerToDelete(null)}
									>
										<AlertDialogTrigger asChild>
											<DropdownMenuItem
												onSelect={(e) => {
													e.preventDefault();
													setServerToDelete(server.id);
												}}
											>
												<Trash className="mr-2 h-4 w-4" />
												<span>Delete</span>
											</DropdownMenuItem>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Are you sure?</AlertDialogTitle>
												<AlertDialogDescription>
													This will permanently delete the MCP server "
													{server.name}" and remove all its configuration.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<AlertDialogAction
													onClick={() => handleDeleteServer(server.id)}
												>
													Delete
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<p className="text-sm font-medium text-gray-500">
										Server Type
									</p>
									<p className="mt-1">
										<Badge variant="outline">{server.type}</Badge>
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-500">
										Last Connected
									</p>
									<p className="mt-1 text-sm">
										{new Date(server.lastConnected).toLocaleString()}
									</p>
								</div>
							</div>
							<div>
								<p className="text-sm font-medium text-gray-500">
									Connection URL/Command
								</p>
								<p className="mt-1 text-sm font-mono bg-slate-50 p-2 rounded border overflow-x-auto">
									{server.url}
								</p>
							</div>
						</div>
					</CardContent>
					<CardFooter className="flex justify-between">
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleToggleServer(server.id)}
						>
							{server.status === "online" ? (
								<>
									<PowerOff className="mr-2 h-4 w-4" />
									Disconnect
								</>
							) : (
								<>
									<Power className="mr-2 h-4 w-4" />
									Connect
								</>
							)}
						</Button>
						<div className="flex gap-2">
							<Link href={`/mcp/edit/${server.id}`}>
								<Button variant="outline" size="sm">
									<Edit className="mr-2 h-4 w-4" />
									Edit
								</Button>
							</Link>
						</div>
					</CardFooter>
				</Card>
			))}
		</div>
	);
}
