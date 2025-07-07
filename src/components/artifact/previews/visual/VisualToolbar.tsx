"use client";

import { useState, type RefObject } from "react";
import { motion } from "framer-motion";
import {
	ZoomIn,
	ZoomOut,
	RotateCw,
	RotateCcw,
	Maximize2,
	Download,
	Copy,
	MoreHorizontal,
	ImageIcon,
	FileText,
	BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
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
	content
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
						new ClipboardItem({ [blob.type]: blob })
					]);
				} else if (imageSrc.startsWith("blob:")) {
					// SVG blob
					const response = await fetch(imageSrc);
					const blob = await response.blob();
					await navigator.clipboard.write([
						new ClipboardItem({ [blob.type]: blob })
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

	// 获取内容类型图标和标签
	const getContentTypeInfo = () => {
		switch (contentType) {
			case "image":
				return { icon: ImageIcon, label: "Image", color: "bg-blue-500/10 text-blue-600" };
			case "svg":
				return { icon: FileText, label: "SVG", color: "bg-green-500/10 text-green-600" };
			case "chart":
				return { icon: BarChart3, label: "Chart", color: "bg-purple-500/10 text-purple-600" };
			default:
				return { icon: FileText, label: "Visual", color: "bg-gray-500/10 text-gray-600" };
		}
	};

	const contentInfo = getContentTypeInfo();
	const ContentIcon = contentInfo.icon;

	return (
		<div className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur">
			{/* 左侧：标题和类型标签 */}
			<div className="flex items-center gap-3 min-w-0">
				<Badge variant="secondary" className={cn("gap-1", contentInfo.color)}>
					<ContentIcon className="w-3 h-3" />
					{contentInfo.label}
				</Badge>
				{title && (
					<h3 className="text-sm font-medium text-foreground truncate">
						{title}
					</h3>
				)}
			</div>

			{/* 右侧：工具按钮 */}
			<div className="flex items-center gap-1">
				{/* 缩放控制 - 仅对图片和 SVG 显示 */}
				{contentType !== "chart" && (
					<div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-md">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleZoomOut}
							disabled={zoom <= 25}
							className="h-7 w-7 p-0"
						>
							<ZoomOut className="w-3 h-3" />
						</Button>
						
						<button
							onClick={handleResetZoom}
							className="px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors min-w-[3rem] text-center"
						>
							{zoom}%
						</button>
						
						<Button
							variant="ghost"
							size="sm"
							onClick={handleZoomIn}
							disabled={zoom >= 500}
							className="h-7 w-7 p-0"
						>
							<ZoomIn className="w-3 h-3" />
						</Button>
					</div>
				)}

				{/* 旋转控制 - 仅对图片和 SVG 显示 */}
				{contentType !== "chart" && (
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleRotateLeft}
							className="h-8 w-8 p-0"
						>
							<RotateCcw className="w-4 h-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleRotateRight}
							className="h-8 w-8 p-0"
						>
							<RotateCw className="w-4 h-4" />
						</Button>
					</div>
				)}

				{/* 全屏按钮 */}
				<Button
					variant="ghost"
					size="sm"
					onClick={handleFullscreen}
					className="h-8 w-8 p-0"
				>
					<Maximize2 className="w-4 h-4" />
				</Button>

				{/* 更多操作 */}
				<DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
							<MoreHorizontal className="w-4 h-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-40">
						<DropdownMenuItem onClick={handleCopy}>
							<Copy className="w-4 h-4 mr-2" />
							{copyStatus === "copied" ? "已复制!" : "复制"}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handleDownload}>
							<Download className="w-4 h-4 mr-2" />
							下载
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={handleResetZoom}>
							重置视图
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
