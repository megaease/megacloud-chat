"use client";
import { useTranslations } from "next-intl";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import type { Chat } from "@/server/db/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconPlus, IconServer, IconX, IconBox } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";
import { NavUser } from "./nav-user";
import { MCPDrawer } from "./mcp/mcp-drawer";
import logo from "@/assets/logo.svg";
import Image from "next/image";
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
import { use, useState } from "react";
import { useMCPDrawer } from "@/context/mcp-drawer-context";
const userId = "user-id"; // Replace with actual user ID

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const t = useTranslations("Navigation");
	const tCommon = useTranslations("Common");
	const router = useRouter();
	const pathname = usePathname();
	const queryClient = useQueryClient();
	const [isAlertOpen, setIsAlertOpen] = useState(false);
	const [chatToDelete, setChatToDelete] = useState<string | null>(null);

	const {
		data: chatData = [],
		isLoading,
		isError,
	} = useQuery<Chat[]>({
		queryKey: ["chats", userId],
		queryFn: async () => {
			const res = await fetch("/api/chats", {
				headers: {
					userId: userId,
				},
			});
			const data = await res.json();
			return data.chats;
		},
		enabled: !!userId,
		staleTime: 1000 * 60 * 2,
	});

	// Delete chat mutation
	const deleteChatMutation = useMutation({
		mutationFn: async (chatId: string) => {
			const response = await fetch("/api/chats", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					userId: userId,
				},
				body: JSON.stringify({ chatId }),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to delete chat");
			}

			return response.json();
		},
		onSuccess: (_, chatId) => {
			// Refresh chat list after successful deletion
			queryClient.invalidateQueries({ queryKey: ["chats", userId] });
			toast.success("Chat deleted");

			// Navigate to homepage if currently viewing the deleted chat
			if (pathname.includes(`/chat/${chatId}`)) {
				router.push("/");
			}
		},
		onError: (error) => {
			toast.error(`Delete failed: ${error.message}`);
		},
	});

	const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		setChatToDelete(chatId);
		setIsAlertOpen(true);
	};

	const confirmDelete = () => {
		if (chatToDelete) {
			deleteChatMutation.mutate(chatToDelete);
		}
		setIsAlertOpen(false);
	};

	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<div className="flex items-center px-4 py-2 gap-1 mb-1">
					<Image src={logo} alt="alt" width={36} height={36} />
					<h1 className="font-bold text-lg">Megacloud Chat</h1>
				</div>

				<div className="w-full px-4 space-y-2">
					<Button
						onClick={() => router.push("/")}
						title={t("newChat")}
						className="w-full rounded-xl"
					>
						<IconPlus className="mr-2 h-4 w-4" />
						{t("newChat")}
					</Button>

					<Button
						onClick={() => router.push("/artifacts")}
						title="Artifact 管理"
						variant="outline"
						className="w-full rounded-xl"
					>
						<IconBox className="mr-2 h-4 w-4" />
						Artifact 管理
					</Button>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup key={"chats"}>
					<SidebarGroupLabel className="flex items-center justify-between">
						{t("chat")}
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{isLoading ? (
								<div className="px-4 py-2 text-muted-foreground text-sm">
									Loading...
								</div>
							) : isError ? (
								<div className="px-4 py-2 text-destructive text-sm">
									Failed to load
								</div>
							) : chatData.length === 0 ? (
								<div className="px-4 py-2 text-muted-foreground text-sm">
									{t("noChatsFound")}
								</div>
							) : (
								chatData.map((item) => {
									const isActive = pathname === `/chat/${item.id}`;
									return (
										<SidebarMenuItem
											key={item.id}
											className="group-item relative overflow-hidden"
										>
											<SidebarMenuButton
												asChild
												isActive={isActive}
												className="flex-1 truncate group/item"
											>
												<Link
													href={`/chat/${item.id}`}
													className="flex items-center justify-between w-full min-w-0 pr-6"
												>
													<span className="truncate">{item.title}</span>
													<Button
														variant="ghost"
														size="icon"
														className={cn(
															"absolute right-1 top-1/2 h-6 w-6", // Base positioning
															"opacity-0 group-hover/item:opacity-100", // Fade in/out on hover
															"translate-x-full group-hover/item:translate-x-0", // Slide in from right on hover
															"transform transition-all duration-200 ease-in-out -translate-y-1/2", // Smooth transition for opacity and transform
														)}
														onClick={(e) => handleDeleteChat(item.id, e)}
														title="Delete chat"
													>
														<IconX className="h-4 w-4" />
													</Button>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})
							)}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<NavUser
					user={{ name: "Megaease", email: "cloud@megaease.com", avatar: "" }}
				/>
			</SidebarFooter>
			<SidebarRail />
			<AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this chat? This action cannot be
							undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDelete}>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Sidebar>
	);
}
