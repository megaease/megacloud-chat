// components/artifact/ArtifactActions.tsx
"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	X,
	MessageSquare,
	Download,
	Share,
	Copy,
	ExternalLink,
	RefreshCw,
	Maximize2,
	Minimize2,
	Code2,
	Eye,
} from "lucide-react";
import { CopyButton } from "../copy-button";
import type { ArtifactKind } from "@/lib/artifact-types";

interface ArtifactActionsProps {
	title: string;
	status: "streaming" | "idle";
	kind: ArtifactKind;
	content: string;
	onClose: () => void;
	onChatToggle?: () => void;
	onRefresh?: () => void;
	onFullscreen?: () => void;
	showChatButton?: boolean;
	isFullscreen?: boolean;
	isMobile?: boolean;
	// 新增预览相关的 props
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
	const tCommon = useTranslations("Common");
	const tArtifact = useTranslations("Artifact");
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
		<div className="flex items-center justify-between px-4 py-2 border-b bg-background min-h-[60px]">
			{/* 左侧：关闭按钮和标题信息 */}
			<div className="flex items-center space-x-3">
				<Button
					variant="ghost"
					size="sm"
					onClick={onClose}
					className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
					title={tArtifact("close")}
				>
					<X className="h-3.5 w-3.5" />
				</Button>

				{/* 移动端聊天切换按钮 */}
				{showChatButton && onChatToggle && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onChatToggle}
						className="h-7 w-7 p-0"
						title={tArtifact("toggleChat")}
					>
						<MessageSquare className="h-3.5 w-3.5" />
					</Button>
				)}

				<div className="flex items-center gap-3">
					<h3 className="font-semibold text-base truncate max-w-[200px] md:max-w-[300px]">
						{title}
					</h3>
					<div className="flex items-center gap-2">
						<p className="text-xs text-muted-foreground">
							{status === "streaming"
								? tArtifact("generating")
								: tArtifact("completed")}
						</p>
						{status === "streaming" && (
							<div className="flex items-center gap-1">
								<div className="animate-pulse w-1 h-1 bg-primary rounded-full" />
								<div className="animate-pulse w-1 h-1 bg-primary rounded-full animation-delay-100" />
								<div className="animate-pulse w-1 h-1 bg-primary rounded-full animation-delay-200" />
							</div>
						)}
					</div>
				</div>
			</div>

			{/* 右侧：操作按钮组 */}
			<div className="flex items-center gap-2">
				{/* 代码预览切换 Tabs */}
				{kind === "code" && onViewModeChange && (
					<Tabs
						value={viewMode}
						onValueChange={(value) =>
							onViewModeChange(value as "code" | "preview")
						}
						className="mr-2"
					>
						<TabsList className="h-8">
							<TabsTrigger value="code" className="h-6 px-2 text-xs">
								<Code2 className="w-3 h-3 mr-1" />
								{tArtifact("code")}
							</TabsTrigger>
							<TabsTrigger value="preview" disabled={!canPreview}>
								<Eye className="w-3 h-3 mr-1" />
								{canPreview
									? tArtifact("preview")
									: tArtifact("previewUnavailable")}
							</TabsTrigger>
						</TabsList>
					</Tabs>
				)}
				{onRefresh ? (
					<Button
						variant="ghost"
						size="sm"
						onClick={onRefresh}
						disabled={status === "streaming"}
						className="h-7 px-2"
						title={tArtifact("regenerate")}
					>
						<RefreshCw
							className={`h-3 w-3 ${status === "streaming" ? "animate-spin" : ""}`}
						/>
						{!isMobile && (
							<span className="ml-1 text-xs">{tArtifact("regenerate")}</span>
						)}
					</Button>
				) : null}

				{/* 复制按钮 */}
				<CopyButton
					text={content}
					className="h-7 px-2"
					size="sm"
					showText={false}
				/>

				{/* 下载按钮 */}
				<Button
					variant="ghost"
					size="sm"
					onClick={handleDownload}
					className="h-7 px-2"
					title={tCommon("download")}
				>
					<Download className="h-3 w-3" />
					{!isMobile && (
						<span className="ml-1 text-xs">{tCommon("download")}</span>
					)}
				</Button>

				{/* 分享按钮（支持 Web Share API 的浏览器） */}
				{typeof window !== "undefined" && "share" in navigator && (
					<Button
						variant="ghost"
						size="sm"
						onClick={handleShare}
						className="h-7 px-2"
						title={tArtifact("share")}
					>
						<Share className="h-3 w-3" />
						{!isMobile && <span className="ml-1 text-xs">分享</span>}
					</Button>
				)}

				{/* 全屏切换按钮 */}
				{onFullscreen && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onFullscreen}
						className="h-7 px-2"
						title={
							isFullscreen
								? tArtifact("exitFullscreen")
								: tArtifact("fullscreen")
						}
					>
						{isFullscreen ? (
							<Minimize2 className="h-3 w-3" />
						) : (
							<Maximize2 className="h-3 w-3" />
						)}
						{!isMobile && (
							<span className="ml-1 text-xs">
								{isFullscreen ? "退出全屏" : "全屏"}
							</span>
						)}
					</Button>
				)}
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
