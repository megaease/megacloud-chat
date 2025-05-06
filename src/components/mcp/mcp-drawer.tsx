"use client";

import { useState } from "react";
import { X, Server, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServerList } from "./server-list";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddServerDialog } from "./add-server-dialog";
import { useQueryClient } from "@tanstack/react-query";
// import { ServersList } from "@/components/mcp/servers-list";
// import { AddServerDialog } from "@/components/mcp/add-server-dialog";

export function MCPDrawer() {
	const [isAddServerOpen, setIsAddServerOpen] = useState(false);
	const queryClient = useQueryClient();
	const handleAddServerSuccess = () => {
		setIsAddServerOpen(false);
		queryClient.invalidateQueries({
			queryKey: ["getMcpServers"],
		});
	};

	return (
		<Sheet>
			<SheetTrigger asChild>
				<div className="px-4 py-2">
					<Button
						variant={"outline"}
						className="relative w-full"
						aria-label="MCP Settings"
						title="MCP Servers"
					>
						<Server className="mr-2 h-4 w-4" />
						<span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500" />
						MCP Servers
					</Button>
				</div>
			</SheetTrigger>
			<SheetContent className="p-0 overflow-hidden max-h-dvh md:max-w-md lg:max-w-lg sm:max-w-sm">
				<div className="flex flex-col h-full overflow-hidden">
					<SheetHeader className="px-6 py-4 border-b">
						<div className="flex items-center justify-between">
							<SheetTitle className="flex items-center">
								<Server className="mr-2 h-5 w-5" />
								MCP Servers
							</SheetTitle>
						</div>
					</SheetHeader>

					<div className="flex items-center gap-2 border-b justify-end px-4 py-2">
						<Button
							variant="outline"
							size="sm"
							className="h-8 px-2"
							onClick={() => setIsAddServerOpen(true)}
						>
							<Plus className="h-4 w-4 mr-1" />
							Add Server
						</Button>
					</div>

					<div className="flex-1 overflow-auto ">
						<ScrollArea className="h-full overflow-auto p-4">
							<ServerList onAddServer={() => setIsAddServerOpen(true)} />
						</ScrollArea>
					</div>
				</div>
			</SheetContent>
			<div className="max-h-[80%]">
				<AddServerDialog
					open={isAddServerOpen}
					onOpenChange={setIsAddServerOpen}
					onSuccess={handleAddServerSuccess}
				/>
			</div>
		</Sheet>
	);
}
