"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ApiProviderWrapper } from "@/context/api-provider-context";
import { MCPDrawerProvider } from "@/context/mcp-drawer-context";
import { HeaderNav } from "./header-nav";
import { ProviderManagementModal } from "./provider/provider-management-modal";

export default function Page({ children }: React.PropsWithChildren) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<ApiProviderWrapper>
				<MCPDrawerProvider>
					<SidebarProvider>
						<AppSidebar />
						<div className="flex h-dvh flex-col w-full">
							<HeaderNav />
							<div className="flex-1 overflow-auto">{children}</div>
						</div>
					</SidebarProvider>
					<ProviderManagementModal />
					<Toaster richColors position="top-right" />
				</MCPDrawerProvider>
			</ApiProviderWrapper>
		</ThemeProvider>
	);
}
