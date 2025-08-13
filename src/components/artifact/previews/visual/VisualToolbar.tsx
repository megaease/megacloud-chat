"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
	BarChart3,
	Check,
	Copy,
	Download,
	FileText,
	ImageIcon,
	Maximize2,
	MoreHorizontal,
	RotateCcw,
	RotateCw,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { type RefObject, useState } from "react";
import type { VisualContentType, VisualState } from "../VisualPreview";

interface VisualToolbarProps {
	contentType: VisualContentType;
	title?: string;
	visualState: VisualState;
	updateVisualState: (updates: Partial<VisualState>) => void;
	imageSrc?: string;
	imageRef?: RefObject<HTMLImageElement | null>;
	content: string;
}

export function VisualToolbar({
	contentType,
	title,
	visualState,
	updateVisualState,
	imageSrc,
	imageRef,
	content,
}: VisualToolbarProps) {
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const { zoom, rotation, copyStatus } = visualState;

	// 缩放控制
	const handleZoomIn = () => {
		updateVisualState({ zoom: Math.min(500, zoom + 25) });
	};

	const handleZoomOut = () => {
		updateVisualState({ zoom: Math.max(25, zoom - 25) });
	};

	const handleResetZoom = () => {
		updateVisualState({ zoom: 100, rotation: 0 });
	};

	// 旋转控制
	const handleRotateLeft = () => {
		updateVisualState({ rotation: rotation - 90 });
	};

	const handleRotateRight = () => {
		updateVisualState({ rotation: rotation + 90 });
	};

	// 全屏
	const handleFullscreen = () => {
		updateVisualState({ isFullscreen: true });
	};

	// 复制功能
	const handleCopy = async () => {
		try {
			if (contentType === "image" && imageSrc) {
				if (imageSrc.startsWith("data:")) {
					// base64 图片
					const response = await fetch(imageSrc);
					const blob = await response.blob();
					await navigator.clipboard.write([
						new ClipboardItem({ [blob.type]: blob }),
					]);
				} else if (imageSrc.startsWith("blob:")) {
					// SVG blob
					const response = await fetch(imageSrc);
					const blob = await response.blob();
					await navigator.clipboard.write([
						new ClipboardItem({ [blob.type]: blob }),
					]);
				} else {
					// URL 图片，复制链接
					await navigator.clipboard.writeText(imageSrc);
				}
			} else {
				// 其他内容复制文本
				await navigator.clipboard.writeText(content);
			}

			updateVisualState({ copyStatus: "copied" });
			setTimeout(() => {
				updateVisualState({ copyStatus: "idle" });
			}, 2000);
		} catch (error) {
			console.error("Copy failed:", error);
		}
	};

	// 下载功能
	const handleDownload = () => {
		try {
			let url: string;
			let filename: string;

			if (contentType === "svg") {
				const blob = new Blob([content], { type: "image/svg+xml" });
				url = URL.createObjectURL(blob);
				filename = `${title || "visual"}.svg`;
			} else if (contentType === "chart") {
				const blob = new Blob([content], { type: "application/json" });
				url = URL.createObjectURL(blob);
				filename = `${title || "chart"}.json`;
			} else if (imageSrc) {
				url = imageSrc;
				filename = `${title || "image"}.png`;
			} else {
				return;
			}

			const link = document.createElement("a");
			link.href = url;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			if (contentType === "svg" || contentType === "chart") {
				URL.revokeObjectURL(url);
			}
		} catch (error) {
			console.error("Download failed:", error);
		}
	};

	// 获取内容类型标签
	const getContentTypeLabel = () => {
		switch (contentType) {
			case "image":
				return "图像预览";
			case "svg":
				return "SVG 预览";
			case "chart":
				return "图表预览";
			default:
				return "视觉预览";
		}
	};

	return (
		<div className="flex items-center justify-between px-3 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 min-h-[40px]">
			{/* 左侧：图像类型标识和统计信息 */}
			<div className="flex items-center gap-3 flex-shrink-0">
				<div className="flex items-center gap-2 px-2.5 py-1 bg-muted/40 rounded-md border border-border/40">
					{contentType === "image" && (
						<ImageIcon className="w-4 h-4 text-blue-600" />
					)}
					{contentType === "svg" && (
						<FileText className="w-4 h-4 text-green-600" />
					)}
					{contentType === "chart" && (
						<BarChart3 className="w-4 h-4 text-purple-600" />
					)}
					<span className="text-sm font-medium text-foreground">
						{getContentTypeLabel()}
					</span>
				</div>

				{title && (
					<span className="text-xs text-muted-foreground truncate max-w-[200px]">
						{title}
					</span>
				)}
			</div>

			{/* 中间：缩放控制 */}
			{contentType !== "chart" && (
				<div className="flex items-center gap-1 flex-1 justify-center">
					<Button
						variant="ghost"
						size="sm"
						onClick={handleZoomOut}
						disabled={zoom <= 25}
						className="h-7 px-2 text-xs rounded-md"
						title="缩小"
					>
						<ZoomOut className="h-3.5 w-3.5" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={handleResetZoom}
						className="h-7 px-3 text-xs rounded-md min-w-[60px]"
						title="重置缩放"
					>
						{zoom}%
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={handleZoomIn}
						disabled={zoom >= 500}
						className="h-7 px-2 text-xs rounded-md"
						title="放大"
					>
						<ZoomIn className="h-3.5 w-3.5" />
					</Button>
				</div>
			)}

			{/* 右侧：操作按钮 */}
			<div className="flex items-center gap-1 flex-shrink-0">
				{/* 桌面端按钮组 */}
				<div className="hidden md:flex items-center gap-1">
					{/* 旋转按钮 */}
					{contentType !== "chart" && (
						<>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleRotateLeft}
								className="h-7 px-2 text-xs rounded-md"
								title="向左旋转"
							>
								<RotateCcw className="h-3.5 w-3.5" />
							</Button>

							<Button
								variant="ghost"
								size="sm"
								onClick={handleRotateRight}
								className="h-7 px-2 text-xs rounded-md"
								title="向右旋转"
							>
								<RotateCw className="h-3.5 w-3.5" />
							</Button>
						</>
					)}

					{/* 操作按钮组 */}
					<div className="flex items-center rounded-md overflow-hidden bg-background border border-border/50">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleCopy}
							className={cn(
								"h-7 px-2 text-xs rounded-none border-0",
								copyStatus === "copied"
									? "text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
									: "hover:bg-muted/50",
							)}
							title={copyStatus === "copied" ? "已复制" : "复制"}
						>
							{copyStatus === "copied" ? (
								<Check className="h-3.5 w-3.5 mr-1" />
							) : (
								<Copy className="h-3.5 w-3.5 mr-1" />
							)}
							{copyStatus === "copied" ? "已复制" : "复制"}
						</Button>

						<div className="w-px h-4 bg-border" />

						<Button
							variant="ghost"
							size="sm"
							onClick={handleDownload}
							className="h-7 px-2 text-xs rounded-none border-0 hover:bg-muted/50"
							title="下载"
						>
							<Download className="h-3.5 w-3.5 mr-1" />
							下载
						</Button>

						<div className="w-px h-4 bg-border" />

						<Button
							variant="ghost"
							size="sm"
							onClick={handleFullscreen}
							className="h-7 px-2 text-xs rounded-none border-0 hover:bg-muted/50"
							title="全屏"
						>
							<Maximize2 className="h-3.5 w-3.5 mr-1" />
							全屏
						</Button>
					</div>
				</div>

				{/* 移动端菜单 */}
				<div className="md:hidden">
					<DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-7 px-2 text-xs rounded-md"
								title="更多选项"
							>
								<MoreHorizontal className="h-3.5 w-3.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-44">
							{contentType !== "chart" && (
								<>
									<DropdownMenuItem onClick={handleRotateLeft}>
										<RotateCcw className="h-4 w-4 mr-2" />
										向左旋转
									</DropdownMenuItem>
									<DropdownMenuItem onClick={handleRotateRight}>
										<RotateCw className="h-4 w-4 mr-2" />
										向右旋转
									</DropdownMenuItem>
									<DropdownMenuSeparator />
								</>
							)}
							<DropdownMenuItem onClick={handleCopy}>
								{copyStatus === "copied" ? (
									<Check className="h-4 w-4 mr-2" />
								) : (
									<Copy className="h-4 w-4 mr-2" />
								)}
								{copyStatus === "copied" ? "已复制" : "复制"}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleDownload}>
								<Download className="h-4 w-4 mr-2" />
								下载
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleFullscreen}>
								<Maximize2 className="h-4 w-4 mr-2" />
								全屏
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleResetZoom}>
								重置视图
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	);
}
