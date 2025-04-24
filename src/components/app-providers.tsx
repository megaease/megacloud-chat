"use client";
import { Chat } from "@/components/chat";
import { AppSidebar } from "@/components/app-sidebar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();
export default function Page({ children }: React.PropsWithChildren) {
	return (
		<QueryClientProvider client={queryClient}>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset>
					<header className="relative flex h-16 shrink-0 items-center gap-2 border-b px-4">
						<div className="absolute top-4 left-4 z-50">
							<SidebarTrigger />
						</div>
					</header>
					<div className="h-full">{children}</div>
				</SidebarInset>
			</SidebarProvider>
		</QueryClientProvider>
	);
}
