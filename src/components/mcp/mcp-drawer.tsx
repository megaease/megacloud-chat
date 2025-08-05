"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { IconServer, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { ServerList } from "./server-list";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddServerDialog } from "./add-server-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useMCPDrawer } from "@/context/mcp-drawer-context";

interface MCPDrawerProps {
	children?: React.ReactNode;
	trigger?: React.ReactNode;
}

export function MCPDrawer({ children, trigger }: MCPDrawerProps) {
	const tNav = useTranslations("Navigation");
	const tCommon = useTranslations("Common");
	const [isAddServerOpen, setIsAddServerOpen] = useState(false);
	const queryClient = useQueryClient();
	const { isOpen, openDrawer, closeDrawer } = useMCPDrawer();

	const handleAddServerSuccess = () => {
		setIsAddServerOpen(false);
		queryClient.invalidateQueries({
			queryKey: ["mcp-servers"],
		});
	};

	return (
		<Sheet open={isOpen} onOpenChange={closeDrawer}>
			<SheetContent className="p-0 overflow-hidden max-h-dvh md:max-w-md lg:max-w-lg sm:max-w-sm">
				<div className="flex flex-col h-full overflow-hidden">
					<SheetHeader className="px-6 py-4 border-b">
						<div className="flex items-center justify-between">
							<SheetTitle className="flex items-center">
								<IconServer className="mr-2 h-5 w-5" />
								{tNav("mcpServers")}
							</SheetTitle>
						</div>
					</SheetHeader>

					<div className="flex-1 overflow-auto">
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
					customTrigger
				/>
			</div>
		</Sheet>
	);
}
