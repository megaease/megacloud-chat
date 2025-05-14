"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "./mode-toggle";
import { ApiSettingsProvider } from "@/context/api-settings-context";
import { ApiSettingsButton } from "./api-settings-button";
import { ApiSettingsModal } from "./api-settings-modal";
import { MCPDrawerProvider } from "@/context/mcp-drawer-context";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

const queryClient = new QueryClient();
export default function Page({ children }: React.PropsWithChildren) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<ApiSettingsProvider>
				<QueryClientProvider client={queryClient}>
					<MCPDrawerProvider>
						<SidebarProvider>
							<AppSidebar />
							<SidebarInset className="flex h-dvh flex-col">
								<header className="relative flex shrink-0 items-center gap-2 border-b px-4 justify-between py-2">
									<div className="">
										<SidebarTrigger />
									</div>
									<div className="flex items-center gap-2">
										<ApiSettingsButton />
										<ModeToggle />
										<Button
											variant="outline"
											size="icon"
											asChild
											className="text-muted-foreground hover:text-foreground"
										>
											<a
												href="https://github.com/megaease/megacloud-mcp-client"
												target="_blank"
												rel="noopener noreferrer"
												title="View on GitHub"
											>
												<Github className="h-4 w-4" />
												<span className="sr-only">GitHub</span>
											</a>
										</Button>
									</div>
								</header>
								<div className="flex-1 overflow-auto">{children}</div>
							</SidebarInset>
						</SidebarProvider>
						<ApiSettingsModal />
						<Toaster richColors position="top-right" />
					</MCPDrawerProvider>
				</QueryClientProvider>
			</ApiSettingsProvider>
		</ThemeProvider>
	);
}
