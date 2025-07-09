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
		<div className="border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
			{/* 主工具栏 */}
			<div className="flex items-center justify-between px-4 py-3 min-h-[52px]">
				{/* 左侧：控制按钮组 */}
				<div className="flex items-center gap-3 flex-shrink-0">
					{/* 关闭按钮 */}
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="h-9 w-9 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-all duration-200 hover:scale-105"
						title={tCommon("close")}
					>
						<X className="h-4 w-4" />
					</Button>

					{/* 移动端聊天切换按钮 */}
					{showChatButton && onChatToggle && (
						<Button
							variant="ghost"
							size="icon"
							onClick={onChatToggle}
							className="h-9 w-9 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all duration-200 hover:scale-105"
							title={tArtifact("toggleChat")}
						>
							<MessageSquare className="h-4 w-4" />
						</Button>
					)}

					{/* 分隔线 */}
					{(showChatButton || showPreviewTools) && (
						<div className="w-px h-7 bg-gradient-to-b from-transparent via-border to-transparent mx-2" />
					)}

					{/* 预览类型标识 */}
					{showPreviewTools && (previewIcon || previewLabel) && (
						<div className="flex items-center gap-2.5 px-3 py-1.5 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg shadow-sm">
							{previewIcon && (
								<span className="flex-shrink-0 text-primary/80">
									{previewIcon}
								</span>
							)}
							{previewLabel && (
								<span className="text-sm font-semibold text-primary">
									{previewLabel}
								</span>
							)}
						</div>
					)}
				</div>

				{/* 中间：标题和版本信息 */}
				<div className="flex items-center gap-4 flex-1 min-w-0 px-6">
					<h3 className="font-bold text-base text-gray-800 dark:text-gray-200 truncate max-w-[200px] md:max-w-none">
						{displayTitle || tArtifact("untitled")}
					</h3>

					{/* 版本选择器 */}
					{canSwitchVersions && versions.length > 1 && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="h-7 px-2.5 text-xs font-medium bg-background border-border hover:bg-accent hover:text-accent-foreground transition-colors"
									disabled={versionsLoading}
								>
									v{displayCurrentVersion || 1}
									<ChevronDown className="h-3 w-3 ml-1.5 opacity-50" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" className="w-36 p-1">
								<div className="space-y-0.5">
									{versions
										.slice()
										.sort((a, b) => b.version - a.version)
										.map((version) => {
											const isCurrentVersion = version.version === displayCurrentVersion;
											return (
												<DropdownMenuItem
													key={`${version.version}-${version.updatedAt}`}
													onClick={() => handleVersionChange(version.version)}
													className={cn(
														"cursor-pointer flex items-center justify-between px-2.5 py-2 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
														isCurrentVersion && "bg-accent text-accent-foreground font-medium"
													)}
												>
													<span className="text-sm">v{version.version}</span>
													{isCurrentVersion && (
														<Check className="h-3.5 w-3.5 opacity-70" />
													)}
												</DropdownMenuItem>
											);
										})}
								</div>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>

				{/* 右侧：操作按钮组 */}
				<div className="flex items-center gap-2 flex-shrink-0">
					{/* 桌面端按钮组 */}
					<div className="hidden md:flex items-center gap-2">
						{/* Artifact 刷新按钮 */}
						{onRefresh && (
							<Button
								variant="ghost"
								size="icon"
								onClick={onRefresh}
								disabled={status === "streaming" || status === "loading"}
								className="h-9 w-9 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
								title={tCommon("refresh")}
							>
								<RefreshCw
									className={cn(
										"h-4 w-4",
										(status === "streaming" || status === "loading") &&
											"animate-spin",
									)}
								/>
							</Button>
						)}

						{/* 全屏切换按钮 */}
						{onFullscreen && (
							<Button
								variant="ghost"
								size="icon"
								onClick={onFullscreen}
								className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-all duration-200 hover:scale-105"
								title={
									isFullscreen
										? tCommon("exitFullscreen")
										: tCommon("fullscreen")
								}
							>
								{isFullscreen ? (
									<Minimize2 className="h-4 w-4" />
								) : (
									<Maximize2 className="h-4 w-4" />
								)}
							</Button>
						)}
					</div>

					{/* 移动端折叠菜单 */}
					<div className="md:hidden">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-9 w-9 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 rounded-lg transition-all duration-200 hover:scale-105"
									title={tCommon("menu")}
								>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
								{/* 移动端菜单项 */}
								{onRefresh && (
									<DropdownMenuItem
										onClick={onRefresh}
										disabled={status === "streaming" || status === "loading"}
										className="cursor-pointer"
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
									<DropdownMenuItem
										onClick={onFullscreen}
										className="cursor-pointer"
									>
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
			{/* 预览工具栏（条件显示） */}
			{showPreviewTools && (previewTools || content) && (
				<div className="flex items-center justify-between px-4 py-2 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-700">
					{/* 左侧：预览工具 */}
					<div className="flex items-center gap-3 flex-1 min-w-0">
						{previewTools && (
							<div className="flex items-center gap-2">{previewTools}</div>
						)}
					</div>

					{/* 右侧：内容操作按钮 */}
					{content && (
						<div className="flex items-center gap-3 flex-shrink-0">
							{/* 预览刷新按钮 */}
							{onPreviewRefresh && (
								<Button
									variant="ghost"
									size="sm"
									onClick={onPreviewRefresh}
									disabled={previewRefreshing}
									className="h-8 px-3 text-xs hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
									title={tCommon("refresh")}
								>
									<RefreshCw
										className={cn(
											"h-3.5 w-3.5 mr-1.5",
											previewRefreshing && "animate-spin",
										)}
									/>
									{tCommon("refresh")}
								</Button>
							)}

							{/* 复制和下载按钮组 */}
							<div className="flex items-center rounded-md overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
								<Button
									variant="ghost"
									size="sm"
									onClick={handleCopy}
									disabled={!content}
									className={cn(
										"h-8 px-3 text-xs rounded-none border-0 transition-all duration-200 font-medium",
										copyStatus === "copied"
											? "text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
											: "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400",
									)}
									title={
										copyStatus === "copied"
											? tCommon("copied")
											: tCommon("copy")
									}
								>
									{copyStatus === "copied" ? (
										<Check className="h-3.5 w-3.5 mr-1.5" />
									) : (
										<Copy className="h-3.5 w-3.5 mr-1.5" />
									)}
									{copyStatus === "copied"
										? tCommon("copied")
										: tCommon("copy")}
								</Button>

								<div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

								<Button
									variant="ghost"
									size="sm"
									onClick={handleDownload}
									disabled={!content}
									className="h-8 px-3 text-xs rounded-none border-0 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400 transition-all duration-200 font-medium"
									title={tCommon("download")}
								>
									<Download className="h-3.5 w-3.5 mr-1.5" />
									{tCommon("download")}
								</Button>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export { ArtifactActions };
