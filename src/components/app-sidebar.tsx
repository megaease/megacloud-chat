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
import {
  IconPlus,
  IconServer,
  IconX,
  IconBox,
  IconEdit,
  IconCheck,
  IconSearch,
} from "@tabler/icons-react";
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
import { Input } from "@/components/ui/input";
import { use, useState } from "react";
import { useMCPDrawer } from "@/context/mcp-drawer-context";
const userId = "user-id"; // Replace with actual user ID

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("Navigation");
  const tArtifactManager = useTranslations("ArtifactManager");
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

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

  // Rename chat mutation
  const renameChatMutation = useMutation({
    mutationFn: async ({
      chatId,
      title,
    }: {
      chatId: string;
      title: string;
    }) => {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          userId: userId,
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to rename chat");
      }

      return response.json();
    },
    onSuccess: () => {
      // Refresh chat list after successful rename
      queryClient.invalidateQueries({ queryKey: ["chats", userId] });
      toast.success("Chat renamed successfully");
      setEditingChatId(null);
      setEditingTitle("");
    },
    onError: (error) => {
      toast.error(`Rename failed: ${error.message}`);
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

  const handleEditChat = (
    chatId: string,
    currentTitle: string,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (chatId: string) => {
    if (editingTitle.trim() && editingTitle.trim() !== "") {
      renameChatMutation.mutate({ chatId, title: editingTitle.trim() });
    } else {
      setEditingChatId(null);
      setEditingTitle("");
    }
  };

  const handleCancelRename = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveRename(chatId);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelRename();
    }
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
            {tArtifactManager("title")}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup key={"chats"}>
          <SidebarGroupLabel className="flex items-center justify-between">
            {t("chat")}
            <Button
              onClick={() => router.push("/search")}
              title="Search Conversations"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
            >
              <IconSearch className="h-4 w-4" />
            </Button>
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
                  const isEditing = editingChatId === item.id;

                  return (
                    <SidebarMenuItem
                      key={item.id}
                      className="relative overflow-hidden group/item"
                    >
                      {isEditing ? (
                        // Editing mode
                        <div className="flex items-center gap-1 px-2 py-1">
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, item.id)}
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400"
                              onClick={() => handleSaveRename(item.id)}
                              disabled={renameChatMutation.isPending}
                              title="Save (Enter)"
                            >
                              <IconCheck className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                              onClick={handleCancelRename}
                              disabled={renameChatMutation.isPending}
                              title="Cancel (Esc)"
                            >
                              <IconX className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Normal mode
                        <>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className="w-full"
                          >
                            <Link
                              href={`/chat/${item.id}`}
                              className={cn(
                                "flex items-center w-full min-w-0 transition-all duration-300 ease-out",
                                "pr-0 group-hover/item:pr-16" // Smooth padding transition to make room for buttons
                              )}
                            >
                              <span className="truncate">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>

                          {/* Action buttons - slide in from right */}
                          <div
                            className={cn(
                              "absolute right-1 top-1/2 flex items-center gap-1", // Base positioning
                              "opacity-0 group-hover/item:opacity-100", // Fade in
                              "translate-x-2 group-hover/item:translate-x-0", // Slide in from right
                              "transform transition-all duration-300 ease-out -translate-y-1/2", // Smooth transition
                              "pointer-events-none group-hover/item:pointer-events-auto" // Enable pointer events only on hover
                            )}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              onClick={(e) =>
                                handleEditChat(item.id, item.title, e)
                              }
                              title="Rename chat"
                            >
                              <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              onClick={(e) => handleDeleteChat(item.id, e)}
                              title="Delete chat"
                            >
                              <IconX className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
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
