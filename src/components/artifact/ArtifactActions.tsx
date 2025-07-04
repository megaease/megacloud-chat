// components/artifact/ArtifactActions.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	X,
	MessageSquare,
	Download,
	Share,
	Copy,
	Check,
	ExternalLink,
	RefreshCw,
	Maximize2,
	Minimize2,
	Code2,
	Eye,
	ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArtifactKind, ArtifactLanguage } from "@/lib/artifact-types";
import { useArtifact } from "@/context/artifact-provider-context";
import { useArtifactVersions } from "@/hooks/use-artifact-versions";

interface ArtifactActionsProps {
	title: string;
	status: "streaming" | "idle" | "error" | "submitted" | "loading";
	kind: ArtifactKind;
	content: string;
	onClose: () => void;
	onChatToggle?: () => void;
	onRefresh?: () => void;
	onFullscreen?: () => void;
	showChatButton?: boolean;
	isFullscreen?: boolean;
	isMobile?: boolean;
	// 预览相关的 props
	viewMode?: "code" | "preview";
	onViewModeChange?: (mode: "code" | "preview") => void;
	canPreview?: boolean;
}

export function ArtifactActions({
	title,
	status,
	kind,
	content,
	onClose,
	onChatToggle,
	onRefresh,
	onFullscreen,
	showChatButton = false,
	isFullscreen = false,
	isMobile = false,
	viewMode = "code",
	onViewModeChange,
	canPreview = false,
}: ArtifactActionsProps) {
	const { artifact, switchToVersion } = useArtifact();
	const tCommon = useTranslations("Common");
	const tArtifact = useTranslations("Artifact");

	// Copy status management
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

	// Copy handler function
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(content);
			setCopyStatus("copied");
			setTimeout(() => setCopyStatus("idle"), 2000); // Reset after 2 seconds
		} catch (error) {
			console.error("Copy failed:", error);
		}
	};
	const handleDownload = () => {
		const fileExtension = getFileExtension(kind);
		const filename = `${title || "artifact"}.${fileExtension}`;

		const blob = new Blob([content], {
			type: getContentType(kind),
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: title,
					text: content,
				});
			} catch (error) {
				console.log("Error sharing:", error);
			}
		}
	};

	return (
		<div className="relative flex items-center justify-between px-6 py-3 border-b border-gray-200/60 border-solid dark:border-white/10 bg-gradient-to-r from-gray-50/90 via-white/95 to-gray-50/90 dark:from-gray-900/90 dark:via-gray-900/95 dark:to-gray-900/90 backdrop-blur-2xl min-h-[68px]">
			{/* 顶部装饰线 */}
			<div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

			{/* 底部装饰线 */}
			<div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gray-300/40 dark:via-white/20 to-transparent" />
			{/* 左侧：关闭按钮和标题信息 */}
			<div className="flex items-center space-x-4">
				{/* 现代化关闭按钮 */}
				<Button
					variant="ghost"
					size="sm"
					onClick={onClose}
					className="relative h-8 w-8 p-0 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-gray-200/50 border-solid dark:border-white/10 hover:bg-red-50 dark:hover:bg-red-950/50 hover:border-red-200 dark:hover:border-red-800/50 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 group"
				>
					<X className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
				</Button>

				{/* 移动端聊天切换按钮 */}
				{showChatButton && onChatToggle && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onChatToggle}
						className="relative h-8 w-8 p-0 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-gray-200/50 border-solid dark:border-white/10 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:border-blue-200 dark:hover:border-blue-800/50 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 group"
					>
						<MessageSquare className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
					</Button>
				)}

				<div className="flex items-center gap-4">
					{/* 版本下拉菜单 - 只在非流式状态下显示 */}
					{canSwitchVersions && versions && versions.length > 0 ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<div className="group relative">
									{/* 简洁版本下拉触发器 */}
									<Button
										variant="ghost"
										size="sm"
										disabled={status === "streaming" || status === "loading"}
										className="relative h-9 px-4 font-medium rounded-xl bg-white/80 dark:bg-black/40 backdrop-blur border border-gray-200 border-solid dark:border-white/20 hover:bg-white dark:hover:bg-black/50 hover:border-gray-300 dark:hover:border-white/30 transition-all duration-200 disabled:opacity-50 disabled:hover:bg-white/80 dark:disabled:hover:bg-black/40"
									>
										{/* 内容区域 */}
										<div className="flex items-center gap-3">
											<span className="text-sm font-medium text-foreground truncate max-w-[160px] md:max-w-[220px]">
												{displayTitle}
											</span>

											{/* 分隔线 */}
											<div className="w-px h-4 bg-gray-300 dark:bg-white/20" />

											{/* 简洁版本徽章 */}
											<div className="flex items-center gap-2">
												<div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
													v{displayCurrentVersion ?? "N/A"}
												</div>
												<ChevronDown className="w-4 h-4 text-muted-foreground" />
											</div>
										</div>
									</Button>
								</div>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="start"
								className="w-[400px] p-0 rounded-2xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-gray-200/60 border-solid dark:border-white/15"
								sideOffset={12}
							>
								{/* 现代渐变边框效果 */}
								<div className="absolute inset-0 bg-gradient-to-br from-blue-500/12 via-purple-500/8 to-pink-500/12 rounded-2xl" />

								{/* 内容区域 */}
								<div className="relative">
									{/* 精致头部 */}
									<div className="px-6 py-5 border-b border-gray-200/60 border-solid dark:border-white/10">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
													<span className="text-white text-sm font-bold">
														V
													</span>
												</div>
												<div>
													<h4 className="text-base font-semibold text-gray-900 dark:text-white">
														{tArtifact("versionHistory")}
													</h4>
													<p className="text-sm text-gray-500 dark:text-gray-400">
														{tArtifact("selectVersionToView")}
													</p>
												</div>
											</div>
											<div className="px-3 py-1.5 bg-gray-50/80 dark:bg-white/[0.06] rounded-md border border-gray-100/60 border-solid dark:border-white/[0.08">
												<span className="text-sm font-medium text-gray-500 dark:text-gray-400">
													{tArtifact("versionsCount", {
														count: versions.length,
													})}
												</span>
											</div>
										</div>
									</div>

									{/* 现代版本列表 */}
									<div className="p-5 max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300/50">
										<div className="space-y-2">
											{versions.map((version, index) => {
												const isCurrentVersion =
													currentVersion?.version === version.version;
												const isLatestVersion = index === 0;

												return (
													<DropdownMenuItem
														key={version.version}
														onClick={() => {
															handleVersionChange(version.version);
														}}
														className="p-0 focus:bg-transparent"
													>
														<div
															className={`group/item w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer relative border backdrop-blur-sm overflow-hidden
																${
																	isCurrentVersion
																		? "bg-gradient-to-r from-blue-50/90 via-purple-50/70 to-pink-50/90 dark:from-blue-950/60 dark:via-purple-950/50 dark:to-pink-950/60 border-blue-200/70 dark:border-blue-700/70"
																		: "bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/15 border-gray-200/60 border-[1px] border-solid dark:border-white/15 hover:border-gray-300/70 dark:hover:border-white/25"
																}
															`}
														>
															{/* 背景渐变装饰 */}
															{isCurrentVersion && (
																<div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-purple-500/5 to-pink-500/8 opacity-80" />
															)}

															{/* 小巧版本号徽章 */}
															<div className="relative z-10">
																<div className="relative">
																	<div
																		className={`w-6 h-6 flex items-center justify-center rounded text-xs font-medium transition-all duration-200
																			${
																				isCurrentVersion
																					? "bg-blue-500 text-white"
																					: isLatestVersion
																						? "bg-emerald-500 text-white"
																						: "bg-gray-400 text-white"
																			}
																		`}
																	>
																		{version.version}
																	</div>
																</div>
															</div>

															{/* 版本信息 */}
															<div className="flex-1 min-w-0 relative z-10">
																<div className="flex items-center gap-2 mb-1.5">
																	<span className="font-semibold text-sm text-foreground/90 truncate">
																		{version.title}
																	</span>
																	{isCurrentVersion && (
																		<div className="flex items-center gap-1.5">
																			<div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
																			<span className="text-xs font-medium text-blue-600 dark:text-blue-400 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
																				{tArtifact("current")}
																			</span>
																		</div>
																	)}
																	{isLatestVersion && !isCurrentVersion && (
																		<div className="px-2 py-0.5 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-md border border-emerald-200 border-solid dark:border-emerald-700/50">
																			<span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
																				{tArtifact("latest")}
																			</span>
																		</div>
																	)}
																</div>
																<div className="text-xs text-muted-foreground/80">
																	{new Date(
																		version.updatedAt,
																	).toLocaleDateString("zh-CN", {
																		month: "short",
																		day: "numeric",
																		hour: "2-digit",
																		minute: "2-digit",
																	})}
																</div>
															</div>

															{/* 精致指示器 */}
															<div className="opacity-0 group-hover/item:opacity-100 transition-all duration-200 relative z-10">
																<div className="relative">
																	{/* 主指示器 */}
																	<div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse" />
																	{/* 外层光环 */}
																	<div className="absolute inset-0 w-2.5 h-2.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-30 scale-150 animate-ping" />
																</div>
															</div>

															{/* 悬浮渐变 */}
															{!isCurrentVersion && (
																<div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 via-purple-500/6 to-pink-500/8 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 rounded-xl" />
															)}
														</div>
													</DropdownMenuItem>
												);
											})}
										</div>
									</div>
								</div>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<div className="relative h-9 px-4 font-medium rounded-xl bg-white/80 dark:bg-black/40 backdrop-blur border border-gray-200 border-solid dark:border-white/20 flex items-center">
							<span className="text-sm font-medium text-foreground truncate max-w-[160px] md:max-w-[220px]">
								{title}
							</span>
						</div>
					)}

					{/* 精致状态指示器 */}
					<div className="flex items-center gap-3">
						<div className="relative group">
							<div className="flex items-center gap-2.5 px-4 py-2 bg-white/70 dark:bg-black/30 backdrop-blur-xl rounded-2xl border border-gray-200/60 border-solid dark:border-white/15 transition-all duration-300 hover:bg-white/80 dark:hover:bg-black/40 hover:border-gray-300/60 dark:hover:border-white/25">
								{/* 状态图标 */}
								<div
									className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
										status === "streaming" || status === "submitted"
											? "bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"
											: status === "loading"
												? "bg-gradient-to-r from-orange-500 to-yellow-500 animate-pulse"
												: "bg-gradient-to-r from-emerald-500 to-teal-500"
									}`}
								/>

								{/* 状态文本 */}
								<p className="text-xs font-medium text-foreground/80 whitespace-nowrap">
									{status === "submitted"
										? tArtifact("preparing")
										: status === "streaming"
											? tArtifact("generating")
											: status === "loading"
												? tArtifact("loading")
												: status === "idle"
													? tArtifact("completed")
													: status === "error"
														? tArtifact("error")
														: tArtifact("completed")}
								</p>

								{/* 流式生成动画点 */}
								{(status === "streaming" ||
									status === "submitted" ||
									status === "loading") && (
									<div className="flex items-center gap-1 ml-1">
										<div className="animate-pulse w-1.5 h-1.5 bg-blue-500 rounded-full" />
										<div className="animate-pulse w-1.5 h-1.5 bg-purple-500 rounded-full animation-delay-100" />
										<div className="animate-pulse w-1.5 h-1.5 bg-pink-500 rounded-full animation-delay-200" />
									</div>
								)}
							</div>

							{/* 微妙光晕 */}
							<div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md -z-10" />
						</div>
					</div>
				</div>
			</div>

			{/* 右侧：精致操作按钮组 */}
			<div className="flex items-center gap-3">
				{/* 极简 code/preview 切换 */}
				{kind === "code" && onViewModeChange && (
					<Tabs
						value={viewMode}
						onValueChange={(value) =>
							onViewModeChange(value as "code" | "preview")
						}
						className="mr-2"
					>
						<TabsList className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
							<TabsTrigger
								value="preview"
								disabled={!canPreview || status === "streaming"}
								className="h-7 px-3 text-xs rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 text-gray-600 dark:text-gray-400 disabled:opacity-50 transition-colors"
								title={
									!canPreview
										? tArtifact("previewUnavailable")
										: status === "streaming"
											? tArtifact("waitForCompletion")
											: ""
								}
							>
								<Eye className="w-3 h-3 mr-1.5" />
								{canPreview
									? tArtifact("preview")
									: tArtifact("previewUnavailable")}
							</TabsTrigger>
							<TabsTrigger
								value="code"
								className="h-7 px-3 text-xs rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 text-gray-600 dark:text-gray-400 transition-colors"
							>
								<Code2 className="w-3 h-3 mr-1.5" />
								{tArtifact("code")}
							</TabsTrigger>
						</TabsList>
					</Tabs>
				)}

				{/* 精致操作按钮组 */}
				<div className="flex items-center gap-2">
					{onRefresh && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onRefresh}
							disabled={status === "streaming" || status === "loading"}
							className="relative h-8 w-8 p-0 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-gray-200/50 border-solid dark:border-white/10 hover:bg-green-50 dark:hover:bg-green-950/50 hover:border-green-200 dark:hover:border-green-800/50 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 group disabled:opacity-50 disabled:hover:bg-white/60 dark:disabled:hover:bg-black/20"
						>
							<RefreshCw
								className={`h-4 w-4 transition-all duration-200 group-hover:scale-110 ${status === "streaming" || status === "loading" ? "animate-spin" : ""}`}
							/>
						</Button>
					)}

					{/* 合并的复制/下载按钮 */}
					<div className="flex items-center rounded-xl overflow-hidden bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-gray-200/50 border-solid dark:border-white/10">
						{/* 复制按钮 */}
						<Button
							variant="ghost"
							size="sm"
							onClick={handleCopy}
							disabled={status === "streaming" || !content}
							className={cn(
								"relative h-8 w-8 p-0 rounded-none bg-transparent border-0 transition-all duration-200",
								copyStatus === "copied"
									? "bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/60 hover:text-green-700 dark:hover:text-green-300"
									: "hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400",
								(status === "streaming" || !content) &&
									"opacity-50 pointer-events-none hover:bg-transparent hover:text-current",
							)}
						>
							{copyStatus === "copied" ? (
								<Check className="h-3.5 w-3.5 animate-in fade-in-0 zoom-in-95 duration-200" />
							) : (
								<Copy className="h-3.5 w-3.5" />
							)}
						</Button>

						{/* 分隔线 */}
						<div className="w-px h-6 bg-gray-300/60 dark:bg-white/20" />

						{/* 下载按钮 */}
						<Button
							variant="ghost"
							size="sm"
							onClick={handleDownload}
							disabled={status === "streaming" || !content}
							className={cn(
								"relative h-8 w-8 p-0 rounded-none bg-transparent border-0 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200",
								(status === "streaming" || !content) &&
									"opacity-50 pointer-events-none hover:bg-transparent hover:text-current",
							)}
						>
							<Download className="h-3.5 w-3.5" />
						</Button>
					</div>

					{/* 现代化全屏切换按钮 */}
					{onFullscreen && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onFullscreen}
							className="relative h-8 w-8 p-0 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-gray-200/50 border-solid dark:border-white/10 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 group"
						>
							{isFullscreen ? (
								<Minimize2 className="h-3.5 w-3.5 transition-all duration-200 group-hover:scale-110" />
							) : (
								<Maximize2 className="h-3.5 w-3.5 transition-all duration-200 group-hover:scale-110" />
							)}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

// 辅助函数：根据类型获取文件扩展名
function getFileExtension(kind: ArtifactKind): string {
	switch (kind) {
		case "code":
			return "js"; // 可以根据具体语言调整
		case "text":
			return "md";
		case "sheet":
			return "csv";
		case "image":
			return "png";
		default:
			return "txt";
	}
}

// 辅助函数：根据类型获取 MIME 类型
function getContentType(kind: ArtifactKind): string {
	switch (kind) {
		case "code":
			return "text/javascript";
		case "text":
			return "text/markdown";
		case "sheet":
			return "text/csv";
		case "image":
			return "image/png";
		default:
			return "text/plain";
	}
}
