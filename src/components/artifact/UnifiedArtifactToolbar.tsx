// components/artifact/UnifiedArtifactToolbar.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useArtifact } from "@/context/artifact-provider-context";
import { useArtifactVersions } from "@/hooks/use-artifact-versions";
import type { ArtifactKind, UIArtifact } from "@/lib/artifact-types";
import { cn } from "@/lib/utils";
import {
	Check,
	ChevronDown,
	Copy,
	Download,
	Maximize2,
	MessageSquare,
	Minimize2,
	MoreHorizontal,
	RefreshCw,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface UnifiedArtifactToolbarProps {
	// 基础 Artifact 功能
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

	// 预览功能 - 所有 artifact 类型都可能需要的基础功能
	content?: string;
	filename?: string;
	mimeType?: string;

	// 特定类型的预览工具
	previewConfig?: {
		icon?: React.ReactNode;
		label?: string;
		customTools?: React.ReactNode;
		onPreviewRefresh?: () => void;
		refreshing?: boolean;
		showCopyDownload?: boolean;
	};
}

export function UnifiedArtifactToolbar({
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
	content = "",
	filename = "file.txt",
	mimeType = "text/plain",
	previewConfig,
}: UnifiedArtifactToolbarProps) {
	const { artifact, switchToVersion } = useArtifact();
	const tCommon = useTranslations("Common");
	const tArtifact = useTranslations("Artifact");
	const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

	// 获取版本数据，只在 artifact 不是流式传输状态且有 documentId 时才启用
	const { data: versions = [], isLoading: versionsLoading } =
		useArtifactVersions(
			artifact.status !== "streaming" && artifact.documentId
				? artifact.documentId
				: undefined,
		);

	// 通过内容匹配找到当前显示的版本
	const currentVersion = versions.find(
		(v) => v.content === artifact.content && v.title === artifact.title,
	);

	const displayCurrentVersion =
		currentVersion?.version ?? versions?.[0]?.version;
	const displayTitle = artifact.title || title;

	// 版本切换处理
	const handleVersionChange = (version: number) => {
		const versionData = versions.find((v) => v.version === version);
		if (versionData) {
			switchToVersion(versionData);
		}
	};

	const canSwitchVersions =
		artifact.status !== "streaming" && !!artifact.documentId;

	// 复制功能
	const handleCopy = async () => {
		if (!content) return;
		try {
			await navigator.clipboard.writeText(content);
			setCopyStatus("copied");
			setTimeout(() => setCopyStatus("idle"), 2000);
		} catch (error) {
			console.error("Copy failed:", error);
		}
	};

	// 下载功能
	const handleDownload = () => {
		if (!content) return;
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

	// 判断是否应该显示预览工具
	const shouldShowPreviewTools =
		previewConfig &&
		(previewConfig.icon ||
			previewConfig.label ||
			previewConfig.customTools ||
			previewConfig.showCopyDownload);

	return (
		<div className="flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 min-h-[44px]">
			{/* 左侧：基础控制和标题 */}
			<div className="flex items-center space-x-3 flex-1 min-w-0">
				{/* 关闭按钮 */}
				<Button
					variant="ghost"
					size="sm"
					onClick={onClose}
					className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
				>
					<X className="h-3.5 w-3.5" />
				</Button>

				{/* 移动端聊天切换 */}
				{showChatButton && onChatToggle && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onChatToggle}
						className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600 flex-shrink-0"
					>
						<MessageSquare className="h-3.5 w-3.5" />
					</Button>
				)}

				{/* 预览类型标识 */}
				{shouldShowPreviewTools &&
					(previewConfig?.icon || previewConfig?.label) && (
						<div className="flex items-center gap-2 flex-shrink-0">
							{previewConfig?.icon && (
								<div className="flex items-center justify-center">
									{previewConfig.icon}
								</div>
							)}
							{previewConfig?.label && (
								<span className="text-sm font-medium text-foreground truncate">
									{previewConfig.label}
								</span>
							)}
						</div>
					)}

				{/* 标题和版本 */}
				<div className="flex items-center space-x-2 min-w-0 flex-1">
					<h3 className="font-medium text-sm truncate">
						{displayTitle || tArtifact("untitled")}
					</h3>

					{/* 版本选择器 */}
					{canSwitchVersions && versions.length > 1 && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="h-5 px-2 text-xs flex-shrink-0"
									disabled={versionsLoading}
								>
									v{displayCurrentVersion || 1}
									<ChevronDown className="h-2.5 w-2.5 ml-1" />
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

				{/* 自定义预览工具 */}
				{previewConfig?.customTools && (
					<div className="flex-shrink-0">{previewConfig.customTools}</div>
				)}
			</div>

			{/* 右侧：操作按钮 */}
			<div className="flex items-center space-x-1 flex-shrink-0">
				{/* 桌面端按钮 */}
				{!isMobile && (
					<div className="flex items-center space-x-1">
						{/* 预览刷新 */}
						{previewConfig?.onPreviewRefresh && (
							<Button
								variant="ghost"
								size="sm"
								onClick={previewConfig.onPreviewRefresh}
								disabled={previewConfig.refreshing}
								className="h-6 w-6 p-0"
								title={tCommon("refresh")}
							>
								<RefreshCw
									className={cn(
										"h-3.5 w-3.5",
										previewConfig.refreshing && "animate-spin",
									)}
								/>
							</Button>
						)}

						{/* 复制下载按钮组 */}
						{previewConfig?.showCopyDownload && content && (
							<div className="flex items-center rounded-md overflow-hidden bg-background border">
								<Button
									variant="ghost"
									size="sm"
									onClick={handleCopy}
									disabled={!content}
									className={cn(
										"h-6 w-6 p-0 rounded-none border-0",
										copyStatus === "copied"
											? "text-green-600 bg-green-50 hover:bg-green-100"
											: "hover:bg-muted",
									)}
									title={
										copyStatus === "copied"
											? tCommon("copied")
											: tCommon("copy")
									}
								>
									{copyStatus === "copied" ? (
										<Check className="h-3 w-3" />
									) : (
										<Copy className="h-3 w-3" />
									)}
								</Button>
								<div className="w-px h-4 bg-border" />
								<Button
									variant="ghost"
									size="sm"
									onClick={handleDownload}
									disabled={!content}
									className="h-6 w-6 p-0 rounded-none border-0 hover:bg-muted"
									title={tCommon("download")}
								>
									<Download className="h-3 w-3" />
								</Button>
							</div>
						)}

						{/* Artifact 刷新 */}
						{onRefresh && (
							<Button
								variant="ghost"
								size="sm"
								onClick={onRefresh}
								disabled={status === "streaming" || status === "loading"}
								className="h-6 w-6 p-0"
								title={tCommon("refresh")}
							>
								<RefreshCw
									className={cn(
										"h-3.5 w-3.5",
										(status === "streaming" || status === "loading") &&
											"animate-spin",
									)}
								/>
							</Button>
						)}

						{/* 全屏切换 */}
						{onFullscreen && (
							<Button
								variant="ghost"
								size="sm"
								onClick={onFullscreen}
								className="h-6 w-6 p-0"
								title={
									isFullscreen
										? tCommon("exitFullscreen")
										: tCommon("fullscreen")
								}
							>
								{isFullscreen ? (
									<Minimize2 className="h-3.5 w-3.5" />
								) : (
									<Maximize2 className="h-3.5 w-3.5" />
								)}
							</Button>
						)}
					</div>
				)}

				{/* 移动端折叠菜单 */}
				{isMobile && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="sm" className="h-6 w-6 p-0">
								<MoreHorizontal className="h-3.5 w-3.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-40">
							{previewConfig?.onPreviewRefresh && (
								<DropdownMenuItem
									onClick={previewConfig.onPreviewRefresh}
									disabled={previewConfig.refreshing}
								>
									<RefreshCw
										className={cn(
											"h-4 w-4 mr-2",
											previewConfig.refreshing && "animate-spin",
										)}
									/>
									{tCommon("refresh")}
								</DropdownMenuItem>
							)}
							{previewConfig?.showCopyDownload && content && (
								<>
									<DropdownMenuItem onClick={handleCopy} disabled={!content}>
										{copyStatus === "copied" ? (
											<Check className="h-4 w-4 mr-2" />
										) : (
											<Copy className="h-4 w-4 mr-2" />
										)}
										{copyStatus === "copied"
											? tCommon("copied")
											: tCommon("copy")}
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={handleDownload}
										disabled={!content}
									>
										<Download className="h-4 w-4 mr-2" />
										{tCommon("download")}
									</DropdownMenuItem>
								</>
							)}
							{onRefresh && (
								<DropdownMenuItem
									onClick={onRefresh}
									disabled={status === "streaming" || status === "loading"}
								>
									<RefreshCw
										className={cn(
											"h-4 w-4 mr-2",
											(status === "streaming" || status === "loading") &&
												"animate-spin",
										)}
									/>
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
				)}
			</div>
		</div>
	);
}
