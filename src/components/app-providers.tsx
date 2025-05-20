"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ApiSettingsProvider } from "@/context/api-settings-context";
import { ApiSettingsModal } from "./api-settings-modal";
import { MCPDrawerProvider } from "@/context/mcp-drawer-context";
import { HeaderNav } from "./header-nav";

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
								<HeaderNav />
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
