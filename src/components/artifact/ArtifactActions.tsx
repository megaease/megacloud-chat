// components/artifact/ArtifactActions.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	X,
	MessageSquare,
	RefreshCw,
	Maximize2,
	Minimize2,
	ChevronDown,
	Copy,
	Check,
	Download,
	MoreHorizontal,
} from "lucide-react";
import type { ArtifactKind, UIArtifact } from "@/lib/artifact-types";
import { useArtifact } from "@/context/artifact-provider-context";
import { useArtifactVersions } from "@/hooks/use-artifact-versions";
import { cn } from "@/lib/utils";

interface ArtifactActionsProps {
	title: string;
	status: UIArtifact["status"];
	kind: ArtifactKind;
	onClose: () => void;
	onChatToggle?: () => void;
	onRefresh?: () => void;
	onFullscreen?: () => void;
	showChatButton?: boolean;
	isFullscreen?: boolean;
	isMobile?: boolean;
	// 预览工具栏相关 props
	content?: string;
	filename?: string;
	mimeType?: string;
	onPreviewRefresh?: () => void;
	previewRefreshing?: boolean;
	previewIcon?: React.ReactNode;
	previewLabel?: string;
	previewTools?: React.ReactNode;
	showPreviewTools?: boolean;
}

function ArtifactActions({
	title,
	status,
	kind,
	onClose,
	onChatToggle,
	onRefresh,
	onFullscreen,
	showChatButton = false,
	isFullscreen = false,
	isMobile = false,
	// 预览工具栏相关
	content = "",
	filename = "file.txt",
	mimeType = "text/plain",
	onPreviewRefresh,
	previewRefreshing = false,
	previewIcon,
	previewLabel,
	previewTools,
	showPreviewTools = false,
}: ArtifactActionsProps) {
	const { artifact, switchToVersion } = useArtifact();
	const tCommon = useTranslations("Common");
	const tArtifact = useTranslations("Artifact");
	const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

	// 获取版本数据，hook 内部已经处理了 documentId 的有效性检查
	const {
		data: versions = [],
		isLoading: versionsLoading,
		error: versionsError,
	} = useArtifactVersions(artifact.documentId);

	// 通过内容匹配找到当前显示的版本
	const currentVersion = versions.find(
		(v) => v.content === artifact.content && v.title === artifact.title,
	);

	// 显示的当前版本号
	const displayCurrentVersion =
		currentVersion?.version ?? versions?.[0]?.version;
	// 使用 context 中的 title，如果为空则回退到 props 中的 title
	const displayTitle = artifact.title || title;

	// 版本切换处理
	const handleVersionChange = (version: number) => {
		const versionData = versions.find((v) => v.version === version);
		if (versionData) {
			switchToVersion(versionData);
		}
	};

	// 版本切换功能的启用条件：检查 artifact 状态而不是 props 状态
	const canSwitchVersions =
		artifact.status !== "streaming" && !!artifact.documentId;

	// 预览工具栏功能
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(content);
			setCopyStatus("copied");
			setTimeout(() => setCopyStatus("idle"), 2000);
		} catch (error) {
			console.error("Copy failed:", error);
		}
	};

	const handleDownload = () => {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	return (
		<div className="flex items-center justify-between px-3 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 min-h-[36px]">
			{/* 左侧：关闭按钮和标题信息 */}
			<div className="flex items-center gap-2 flex-1 min-w-0">
				{/* 关闭按钮 */}
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive flex-shrink-0 rounded-md"
					title={tCommon("close")}
				>
					<X className="h-3.5 w-3.5" />
				</Button>

				{/* 移动端聊天切换按钮 */}
				{showChatButton && onChatToggle && (
					<Button
						variant="ghost"
						size="icon"
						onClick={onChatToggle}
						className="h-7 w-7 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 flex-shrink-0 rounded-md"
						title={tArtifact("toggleChat")}
					>
						<MessageSquare className="h-3.5 w-3.5" />
					</Button>
				)}

				{/* 预览类型标识 */}
				{showPreviewTools && (previewIcon || previewLabel) && (
					<div className="flex items-center gap-1.5 flex-shrink-0 px-2 py-1 bg-muted/50 rounded-md border border-border/50">
						{previewIcon && 
							<span className="flex-shrink-0">
								{previewIcon}
							</span>
						}
						{previewLabel && (
							<span className="text-xs font-medium text-foreground">
								{previewLabel}
							</span>
						)}
					</div>
				)}

				{/* 标题和版本信息 */}
				<div className="flex items-center gap-2 min-w-0 flex-1">
					<h3 className="font-medium text-xs truncate max-w-[150px] md:max-w-[300px] text-foreground">
						{displayTitle || tArtifact("untitled")}
					</h3>

					{/* 版本选择器 */}
					{canSwitchVersions && versions.length > 1 && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="h-6 px-2 text-xs flex-shrink-0 border-border/60"
									disabled={versionsLoading}
								>
									v{displayCurrentVersion || 1}
									<ChevronDown className="h-3 w-3 ml-1 opacity-70" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" className="w-32">
								{versions
									.slice()
									.sort((a, b) => b.version - a.version)
									.map((version) => (
										<DropdownMenuItem
											key={version.id}
											onClick={() => handleVersionChange(version.version)}
											className="cursor-pointer"
										>
											v{version.version}
											{version.version === displayCurrentVersion && " ✓"}
										</DropdownMenuItem>
									))}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>

				{/* 预览工具 */}
				{showPreviewTools && previewTools && (
					<div className="flex-shrink-0">{previewTools}</div>
				)}
			</div>

			{/* 右侧：工具按钮 */}
			<div className="flex items-center gap-1.5 flex-shrink-0">
				{/* 桌面端直接显示的按钮 */}
				<div className="hidden md:flex items-center gap-1.5">
					{/* 预览刷新按钮 */}
					{showPreviewTools && onPreviewRefresh && (
						<Button
							variant="ghost"
							size="icon"
							onClick={onPreviewRefresh}
							disabled={previewRefreshing}
							className="h-7 w-7 rounded-md"
							title={tCommon("refresh")}
						>
							<RefreshCw
								className={cn("h-3.5 w-3.5", previewRefreshing && "animate-spin")}
							/>
						</Button>
					)}

					{/* 预览工具栏的复制和下载按钮 */}
					{showPreviewTools && content && (
						<div className="flex items-center rounded-md overflow-hidden bg-muted/30 border border-border/50">
							{/* 复制按钮 */}
							<Button
								variant="ghost"
								size="icon"
								onClick={handleCopy}
								disabled={!content}
								className={cn(
									"h-7 w-7 rounded-none border-0",
									copyStatus === "copied"
										? "text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
										: "hover:bg-muted",
								)}
								title={copyStatus === "copied" ? tCommon("copied") : tCommon("copy")}
							>							{copyStatus === "copied" ? (
								<Check className="h-3.5 w-3.5" />
							) : (
								<Copy className="h-3.5 w-3.5" />
							)}
						</Button>

						{/* 分隔线 */}
						<div className="w-px h-4 bg-border/60" />

						{/* 下载按钮 */}
						<Button
							variant="ghost"
							size="icon"
							onClick={handleDownload}
							disabled={!content}
							className="h-7 w-7 rounded-none border-0 hover:bg-muted"
							title={tCommon("download")}
						>
							<Download className="h-3.5 w-3.5" />
						</Button>
					</div>
				)}

				{/* Artifact 刷新按钮 */}
				{onRefresh && (
					<Button
						variant="ghost"
						size="icon"
						onClick={onRefresh}
						disabled={status === "streaming" || status === "loading"}
						className="h-7 w-7 rounded-md"
						title={tCommon("refresh")}
					>
						<RefreshCw
							className={`h-3.5 w-3.5 ${status === "streaming" || status === "loading" ? "animate-spin" : ""}`}
						/>
					</Button>
				)}

				{/* 全屏切换按钮 */}
				{onFullscreen && (
					<Button
						variant="ghost"
						size="icon"
						onClick={onFullscreen}
						className="h-7 w-7 rounded-md"
						title={isFullscreen ? tCommon("exitFullscreen") : tCommon("fullscreen")}
					>
						{isFullscreen ? (
							<Minimize2 className="h-3.5 w-3.5" />
						) : (
							<Maximize2 className="h-3.5 w-3.5" />
						)}
					</Button>
				)}
				</div>			{/* 移动端折叠菜单 */}
			<div className="md:hidden">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" title={tCommon("menu")}>
							<MoreHorizontal className="h-3.5 w-3.5" />
						</Button>
					</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-40">
							{/* 预览工具选项 */}
							{showPreviewTools && onPreviewRefresh && (
								<DropdownMenuItem onClick={onPreviewRefresh} disabled={previewRefreshing}>
									<RefreshCw className={cn("h-4 w-4 mr-2", previewRefreshing && "animate-spin")} />
									{tCommon("refresh")}
								</DropdownMenuItem>
							)}
							{showPreviewTools && content && (
								<>
									<DropdownMenuItem onClick={handleCopy} disabled={!content}>
										{copyStatus === "copied" ? (
											<Check className="h-4 w-4 mr-2" />
										) : (
											<Copy className="h-4 w-4 mr-2" />
										)}
										{copyStatus === "copied" ? tCommon("copied") : tCommon("copy")}
									</DropdownMenuItem>
									<DropdownMenuItem onClick={handleDownload} disabled={!content}>
										<Download className="h-4 w-4 mr-2" />
										{tCommon("download")}
									</DropdownMenuItem>
								</>
							)}
							{/* Artifact 选项 */}
							{onRefresh && (
								<DropdownMenuItem 
									onClick={onRefresh} 
									disabled={status === "streaming" || status === "loading"}
								>
									<RefreshCw className={`h-4 w-4 mr-2 ${status === "streaming" || status === "loading" ? "animate-spin" : ""}`} />
									{tCommon("refresh")}
								</DropdownMenuItem>
							)}
							{onFullscreen && (
								<DropdownMenuItem onClick={onFullscreen}>
									{isFullscreen ? (
										<>
											<Minimize2 className="h-4 w-4 mr-2" />
											{tCommon("exitFullscreen")}
										</>
									) : (
										<>
											<Maximize2 className="h-4 w-4 mr-2" />
											{tCommon("fullscreen")}
										</>
									)}
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	);
}

export { ArtifactActions };
