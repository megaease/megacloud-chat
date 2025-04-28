"use client";
import { Chat } from "@/components/features/chat/chat";
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

const queryClient = new QueryClient();
export default function Page({ children }: React.PropsWithChildren) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<QueryClientProvider client={queryClient}>
				<SidebarProvider>
					<AppSidebar />
					<SidebarInset className="flex h-dvh flex-col">
						<header className="relative flex shrink-0 items-center gap-2 border-b px-4 justify-between py-2">
							<div className="">
								<SidebarTrigger />
							</div>
							<ModeToggle />
						</header>
						<div className="flex-1 overflow-auto">{children}</div>
					</SidebarInset>
				</SidebarProvider>
				<Toaster richColors position="top-right" />
			</QueryClientProvider>
		</ThemeProvider>
	);
}
