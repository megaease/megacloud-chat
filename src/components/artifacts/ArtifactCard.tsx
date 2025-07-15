"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	FileText,
	Code,
	Table,
	Image,
	MoreHorizontal,
	Eye,
	Copy,
	Trash2,
	ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import type { Artifact } from "@/server/db/schema";

// 简单的时间格式化函数
function formatDistanceToNow(date: Date, t: (key: string) => string): string {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const minutes = Math.floor(diff / (1000 * 60));
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (days > 0) {
		return `${days}天前`;
	}
	if (hours > 0) {
		return `${hours}小时前`;
	}
	if (minutes > 0) {
		return `${minutes}分钟前`;
	}
	return "刚刚";
}

interface ArtifactCardProps {
	artifact: Artifact;
	viewMode: "grid" | "list";
	onUpdate?: (silent?: boolean) => void;
}

const kindIcons = {
	text: FileText,
	code: Code,
	sheet: Table,
	image: Image,
};

const kindColors = {
	text: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
	code: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
	sheet:
		"bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
	image:
		"bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

export function ArtifactCard({ artifact, viewMode, onUpdate }: ArtifactCardProps) {
	const t = useTranslations("ArtifactManager");
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const router = useRouter();
	const Icon = kindIcons[artifact.kind as keyof typeof kindIcons] || FileText;

	const handleAction = async (action: string) => {
		setIsMenuOpen(false);
		
		switch (action) {
			case "view":
				// 跳转到聊天页面并自动打开 Artifact modal
				router.push(`/chat/${artifact.chatId}?openArtifact=${artifact.id}`);
				break;
				
			case "copy":
				// 复制artifact内容到剪贴板
				try {
					await navigator.clipboard.writeText(artifact.content);
					toast.success(t("contentCopied"));
				} catch (error) {
					console.error("复制失败:", error);
					toast.error(t("copyFailed"));
				}
				break;
				
			case "open":
				// 在新窗口打开聊天页面并显示 Artifact
				window.open(`/chat/${artifact.chatId}?openArtifact=${artifact.id}`, "_blank");
				break;
				
			case "delete":
				// 显示删除确认对话框
				setShowDeleteDialog(true);
				break;
				
			default:
				console.log(`Unknown action: ${action}`);
		}
	};

	const handleConfirmDelete = async () => {
		try {
			const response = await fetch(`/api/artifacts/${artifact.id}?userId=user-id`, {
				method: "DELETE",
			});
			
			if (response.ok) {
				toast.success(t("deleteSuccess"));
				onUpdate?.(true); // 静默刷新列表
			} else {
				toast.error(t("deleteFailed"));
			}
		} catch (error) {
			console.error("删除失败:", error);
			toast.error(t("deleteFailed"));
		}
	};

	if (viewMode === "list") {
		return (
			<>
				<Card className="hover:shadow-md transition-shadow">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3 flex-1 min-w-0">
								<div
									className={cn(
										"flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
										kindColors[artifact.kind as keyof typeof kindColors],
									)}
								>
									<Icon className="h-5 w-5" />
								</div>
								<div className="flex-1 min-w-0">
									<h3 className="font-medium truncate">{artifact.title}</h3>
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<span>v{artifact.version}</span>
										<span>•</span>
										<span>{formatDistanceToNow(artifact.updatedAt, t)} ago</span>
										{artifact.language && (
											<>
												<span>•</span>
												<Badge variant="outline" className="text-xs">
													{artifact.language}
												</Badge>
											</>
										)}
									</div>
								</div>
							</div>
							<div className="flex items-center gap-2">
								{artifact.isPublic && (
									<Badge variant="secondary" className="text-xs">
										公开
									</Badge>
								)}
								<DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm">
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => handleAction("view")}>
											<Eye className="h-4 w-4 mr-2" />
											{t("viewArtifact")}
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => handleAction("copy")}>
											<Copy className="h-4 w-4 mr-2" />
											{t("copyContent")}
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => handleAction("open")}>
											<ExternalLink className="h-4 w-4 mr-2" />
											{t("openInNewWindow")}
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={() => handleAction("delete")}
											className="text-destructive"
										>
											<Trash2 className="h-4 w-4 mr-2" />
											{t("deleteArtifact")}
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</CardContent>
				</Card>
				
				<DeleteConfirmDialog
					open={showDeleteDialog}
					onOpenChange={setShowDeleteDialog}
					onConfirm={handleConfirmDelete}
					itemName={artifact.title}
					itemType={t(artifact.kind)}
				/>
			</>
		);
	}

	return (
		<>
			<Card className="hover:shadow-md transition-shadow cursor-pointer group">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between">
						<div
							className={cn(
								"w-12 h-12 rounded-lg flex items-center justify-center",
								kindColors[artifact.kind as keyof typeof kindColors],
							)}
						>
							<Icon className="h-6 w-6" />
						</div>
						<DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => handleAction("view")}>
									<Eye className="h-4 w-4 mr-2" />
									{t("viewArtifact")}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => handleAction("copy")}>
									<Copy className="h-4 w-4 mr-2" />
									{t("copyContent")}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => handleAction("open")}>
									<ExternalLink className="h-4 w-4 mr-2" />
									{t("openInNewWindow")}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => handleAction("delete")}
									className="text-destructive"
								>
									<Trash2 className="h-4 w-4 mr-2" />
									{t("deleteArtifact")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<h3 className="font-medium mb-2 line-clamp-2">{artifact.title}</h3>
					<div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
						<span>v{artifact.version}</span>
						<span>{formatDistanceToNow(artifact.updatedAt, t)} ago</span>
					</div>
					<div className="flex items-center gap-2">
						{artifact.language && (
							<Badge variant="outline" className="text-xs">
								{artifact.language}
							</Badge>
						)}
						{artifact.isPublic && (
							<Badge variant="secondary" className="text-xs">
								公开
							</Badge>
						)}
					</div>
				</CardContent>
			</Card>
			
			<DeleteConfirmDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				onConfirm={handleConfirmDelete}
				itemName={artifact.title}
				itemType={t(artifact.kind)}
			/>
		</>
	);
}
