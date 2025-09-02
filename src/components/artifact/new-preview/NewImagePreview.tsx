"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
	Copy,
	Download,
	Image as ImageIcon,
	Loader2,
	Maximize,
	Minimize,
	Palette,
	RotateCw,
	Share2,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState, useCallback, useEffect, useRef } from "react";

// 类型定义
export type ImageContentType = "image" | "svg" | "chart" | "none" | "unknown";

export interface ImagePreviewState {
	zoom: number;
	rotation: number;
	isFullscreen: boolean;
	loaded: boolean;
	error: boolean;
	copyStatus: "idle" | "copied";
	viewMode: "preview" | "info";
}

export interface NewImagePreviewProps {
	content: string;
	title?: string;
	className?: string;
	status?: "idle" | "streaming" | "error" | "loading";
	showToolbar?: boolean;
	initialViewMode?: "preview" | "info";
	canZoom?: boolean;
	canRotate?: boolean;
	canFullscreen?: boolean;
	defaultHeight?: string;
}

// 内容类型检测 Hook
function useContentTypeDetection(content: string): ImageContentType {
	return React.useMemo(() => {
		if (!content || content.trim() === "") return "none";

		const trimmedContent = content.trim();

		// 检测图表 JSON 数据
		try {
			const parsed = JSON.parse(trimmedContent);
			if (
				parsed &&
				typeof parsed === "object" &&
				(parsed.data || parsed.datasets || parsed.series)
			) {
				return "chart";
			}
		} catch {
			// 不是有效的 JSON，继续其他检测
		}

		// 检测 SVG 内容 - 更严格的检测
		if (
			trimmedContent.startsWith("<svg") &&
			trimmedContent.includes("</svg>")
		) {
			return "svg";
		}

		// 检测 base64 格式
		if (trimmedContent.startsWith("data:image/")) {
			return "image";
		}

		// 检测 URL
		if (trimmedContent.startsWith("http") || trimmedContent.startsWith("/")) {
			return "image";
		}

		// 检测 base64 但没有前缀 - 放宽检测条件
		if (
			trimmedContent.match(/^[A-Za-z0-9+/]+=*$/) &&
			trimmedContent.length > 10
		) {
			return "image";
		}

		// 如果内容看起来像 HTML/XML，可能是 SVG 的变体
		if (trimmedContent.startsWith("<") && trimmedContent.includes(">")) {
			return "svg";
		}

		return "unknown";
	}, [content]);
}

export function NewImagePreview({
	content,
	title,
	className = "",
	status = "idle",
	showToolbar = true,
	initialViewMode = "preview",
	canZoom = true,
	canRotate = true,
	canFullscreen = true,
	defaultHeight = "600px",
}: NewImagePreviewProps) {
	const tArtifact = useTranslations("Artifact");
	const tCommon = useTranslations("Common");

	const [imageState, setImageState] = useState<ImagePreviewState>({
		zoom: 100,
		rotation: 0,
		isFullscreen: false,
		loaded: false,
		error: false,
		copyStatus: "idle",
		viewMode: initialViewMode,
	});

	const imageRef = useRef<HTMLImageElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [renderKey, setRenderKey] = useState(0);

	const contentType = useContentTypeDetection(content);

	// 当内容发生变化时，强制重新渲染
	useEffect(() => {
		setRenderKey((prev) => prev + 1);
		setImageState((prev) => ({
			...prev,
			loaded: false,
			error: false,
		}));
	}, [content]);

	// 对于 SVG 和图表内容，立即设置为已加载
	useEffect(() => {
		if (contentType === "svg" || contentType === "chart") {
			setImageState((prev) => ({ ...prev, loaded: true, error: false }));
		}
	}, [contentType]);

	const updateImageState = useCallback(
		(updates: Partial<ImagePreviewState>) => {
			setImageState((prev) => ({ ...prev, ...updates }));
		},
		[],
	);

	// 处理图片内容，支持多种格式
	const getImageSrc = useCallback(() => {
		if (!content) return "";

		if (contentType === "svg") {
			const svgBlob = new Blob([content], { type: "image/svg+xml" });
			return URL.createObjectURL(svgBlob);
		}

		if (content.startsWith("data:image/")) {
			return content;
		}

		if (content.startsWith("http") || content.startsWith("/")) {
			return content;
		}

		if (content.match(/^[A-Za-z0-9+/]+=*$/)) {
			return `data:image/png;base64,${content}`;
		}

		return content;
	}, [content, contentType]);

	const imageSrc = getImageSrc();

	// 图片加载处理
	const handleImageLoad = useCallback(() => {
		updateImageState({ loaded: true, error: false });
	}, [updateImageState]);

	const handleImageError = useCallback(() => {
		updateImageState({ loaded: true, error: true });
	}, [updateImageState]);

	// 缩放控制
	const handleZoomIn = useCallback(() => {
		setImageState((prev) => ({
			...prev,
			zoom: Math.min(prev.zoom + 25, 300),
		}));
	}, []);

	const handleZoomOut = useCallback(() => {
		setImageState((prev) => ({
			...prev,
			zoom: Math.max(prev.zoom - 25, 25),
		}));
	}, []);

	const handleZoomReset = useCallback(() => {
		setImageState((prev) => ({ ...prev, zoom: 100 }));
	}, []);

	// 旋转控制
	const handleRotate = useCallback(() => {
		setImageState((prev) => ({
			...prev,
			rotation: (prev.rotation + 90) % 360,
		}));
	}, []);

	const handleRotateReset = useCallback(() => {
		setImageState((prev) => ({ ...prev, rotation: 0 }));
	}, []);

	// 全屏控制
	const handleFullscreen = useCallback(() => {
		if (!containerRef.current) return;

		if (!imageState.isFullscreen) {
			if (containerRef.current.requestFullscreen) {
				containerRef.current.requestFullscreen();
			}
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			}
		}
		setImageState((prev) => ({ ...prev, isFullscreen: !prev.isFullscreen }));
	}, [imageState.isFullscreen]);

	// 复制图片
	const handleCopy = useCallback(async () => {
		try {
			if (contentType === "svg") {
				await navigator.clipboard.writeText(content);
			} else if (imageRef.current) {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				if (ctx && imageRef.current.naturalWidth > 0) {
					canvas.width = imageRef.current.naturalWidth;
					canvas.height = imageRef.current.naturalHeight;
					ctx.drawImage(imageRef.current, 0, 0);

					canvas.toBlob(async (blob) => {
						if (blob) {
							await navigator.clipboard.write([
								new ClipboardItem({ "image/png": blob }),
							]);
						}
					});
				}
			}
			updateImageState({ copyStatus: "copied" });
			setTimeout(() => updateImageState({ copyStatus: "idle" }), 2000);
		} catch (error) {
			console.error("Failed to copy image:", error);
		}
	}, [content, contentType, updateImageState]);

	// 下载图片
	const handleDownload = useCallback(() => {
		if (!imageSrc) return;

		const extensions: Record<string, string> = {
			"image/svg+xml": "svg",
			"image/png": "png",
			"image/jpeg": "jpg",
			"image/gif": "gif",
			"image/webp": "webp",
		};

		let extension = "png";
		if (contentType === "svg") {
			extension = "svg";
		} else if (imageSrc.startsWith("data:")) {
			const parts = imageSrc.split(";")[0];
			if (parts) {
				const mimeType = parts.split(":")[1];
				extension = extensions[mimeType || ""] || "png";
			}
		}

		const link = document.createElement("a");
		link.href = imageSrc;
		link.download = title ? `${title}.${extension}` : `image.${extension}`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}, [imageSrc, title, contentType]);

	// 渲染图片内容
	const renderImageContent = () => {
		if (contentType === "chart") {
			return (
				<Card className="p-8 h-full flex items-center justify-center bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600">
					<div className="text-center text-muted-foreground">
						<Palette className="w-12 h-12 mx-auto mb-4" />
						<p className="text-lg font-medium mb-2">Chart Preview</p>
						<p className="text-sm">
							Chart rendering will be implemented in a future update.
						</p>
					</div>
				</Card>
			);
		}

		if (contentType === "svg") {
			return (
				<div className="w-full h-full flex items-center justify-center p-4">
					<div
						className="max-w-full max-h-full bg-white dark:bg-slate-900 rounded border-2 border-slate-200 dark:border-slate-600 p-4"
						style={{
							transform: `scale(${imageState.zoom / 100}) rotate(${
								imageState.rotation
							}deg)`,
							transition: "transform 0.3s ease",
						}}
					>
						<div
							className="max-w-full max-h-full"
							dangerouslySetInnerHTML={{ __html: content }}
							suppressHydrationWarning
						/>
					</div>
				</div>
			);
		}

		return (
			<div className="w-full h-full flex items-center justify-center p-4">
				{!imageState.loaded && (
					<div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-800 rounded">
						<Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
					</div>
				)}

				<div className="relative bg-white dark:bg-slate-900 rounded border-2 border-slate-200 dark:border-slate-600 overflow-hidden">
					<img
						ref={imageRef}
						src={imageSrc}
						alt={title || "Preview"}
						className={cn(
							"max-w-full max-h-full object-contain transition-opacity duration-300",
							imageState.loaded ? "opacity-100" : "opacity-0",
						)}
						style={{
							transform: `scale(${imageState.zoom / 100}) rotate(${
								imageState.rotation
							}deg)`,
							transition: "transform 0.3s ease, opacity 0.3s ease",
						}}
						onLoad={handleImageLoad}
						onError={handleImageError}
					/>

					{imageState.error && (
						<div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-900 rounded">
							<div className="text-center text-muted-foreground">
								<ImageIcon className="w-12 h-12 mx-auto mb-4" />
								<p className="text-lg font-medium mb-2">Failed to load image</p>
								<p className="text-sm">The image could not be loaded.</p>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	};

	// 渲染信息面板
	const renderInfoPanel = () => {
		const contentLength = content.length;
		const dimensions = imageRef.current
			? {
					width: imageRef.current.naturalWidth,
					height: imageRef.current.naturalHeight,
				}
			: null;

		return (
			<ScrollArea className="h-full">
				<div className="p-6 space-y-6">
					<div>
						<h3 className="text-lg font-semibold mb-3">Image Information</h3>
						<div className="space-y-3">
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Type:</span>
								<Badge variant="secondary">{contentType.toUpperCase()}</Badge>
							</div>

							{title && (
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">Title:</span>
									<span className="text-sm font-medium">{title}</span>
								</div>
							)}

							{dimensions && (
								<>
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											Width:
										</span>
										<span className="text-sm font-medium">
											{dimensions.width}px
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											Height:
										</span>
										<span className="text-sm font-medium">
											{dimensions.height}px
										</span>
									</div>
								</>
							)}

							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">
									Content Size:
								</span>
								<span className="text-sm font-medium">
									{(contentLength / 1024).toFixed(1)} KB
								</span>
							</div>

							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Zoom:</span>
								<span className="text-sm font-medium">{imageState.zoom}%</span>
							</div>

							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Rotation:</span>
								<span className="text-sm font-medium">
									{imageState.rotation}°
								</span>
							</div>
						</div>
					</div>

					<div>
						<h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
						<div className="grid grid-cols-2 gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleZoomReset}
								disabled={imageState.zoom === 100}
								className="w-full"
							>
								Reset Zoom
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleRotateReset}
								disabled={imageState.rotation === 0}
								className="w-full"
							>
								Reset Rotation
							</Button>
						</div>
					</div>
				</div>
			</ScrollArea>
		);
	};

	// 如果正在流式传输，显示加载状态
	if (status === "streaming" || status === "loading") {
		return (
			<div className={cn("h-full flex items-center justify-center", className)}>
				<div className="text-center space-y-4">
					<Loader2 className="w-8 h-8 animate-spin mx-auto" />
					<p className="text-sm text-muted-foreground">
						{tArtifact("loading")}...
					</p>
				</div>
			</div>
		);
	}

	// 如果没有任何内容
	if (!content || content.trim() === "" || contentType === "none") {
		return (
			<div className={cn("h-full flex items-center justify-center", className)}>
				<div className="text-center space-y-4 p-8">
					<div className="w-16 h-16 mx-auto bg-muted rounded-2xl flex items-center justify-center">
						<ImageIcon className="w-8 h-8" />
					</div>
					<div className="space-y-2">
						<h3 className="text-lg font-semibold">No Image Content</h3>
						<p className="text-sm text-muted-foreground">
							No image content available
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className={cn(
				"overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-full flex flex-col",
				className,
			)}
		>
			{/* Modern header */}
			{showToolbar && (
				<div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
							<ImageIcon className="w-4 h-4 text-green-600" />
							<span className="text-sm font-semibold text-green-800 dark:text-green-300">
								{contentType.toUpperCase()}
							</span>
						</div>

						{/* View mode selector */}
						<div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded p-1">
							<Button
								variant={
									imageState.viewMode === "preview" ? "default" : "ghost"
								}
								size="sm"
								onClick={() => updateImageState({ viewMode: "preview" })}
								className="h-7 px-3 text-xs"
							>
								<ImageIcon className="w-3 h-3 mr-1" />
								Preview
							</Button>
							<Button
								variant={imageState.viewMode === "info" ? "default" : "ghost"}
								size="sm"
								onClick={() => updateImageState({ viewMode: "info" })}
								className="h-7 px-3 text-xs"
							>
								Info
							</Button>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{/* Zoom controls */}
						{canZoom && imageState.viewMode === "preview" && (
							<div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
								<Button
									variant="ghost"
									size="sm"
									onClick={handleZoomOut}
									disabled={imageState.zoom <= 25}
									className="h-7 px-2 text-xs"
									title="Zoom out"
								>
									<ZoomOut className="w-3 h-3" />
								</Button>
								<span className="text-xs font-medium px-2 min-w-[3rem] text-center">
									{imageState.zoom}%
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleZoomIn}
									disabled={imageState.zoom >= 300}
									className="h-7 px-2 text-xs"
									title="Zoom in"
								>
									<ZoomIn className="w-3 h-3" />
								</Button>
							</div>
						)}

						{/* Action buttons */}
						<Button
							variant="outline"
							size="sm"
							onClick={handleCopy}
							className="h-8 px-3 text-xs font-medium gap-1.5 border-slate-300 dark:border-slate-600"
						>
							<Copy className="w-3 h-3" />
							{imageState.copyStatus === "copied" ? "Copied!" : "Copy"}
						</Button>

						<Button
							variant="outline"
							size="sm"
							onClick={handleDownload}
							className="h-8 px-3 text-xs font-medium gap-1.5 border-slate-300 dark:border-slate-600"
						>
							<Download className="w-3 h-3" />
							Download
						</Button>

						{canRotate && imageState.viewMode === "preview" && (
							<Button
								variant="outline"
								size="sm"
								onClick={handleRotate}
								className="h-8 px-3 text-xs font-medium gap-1.5 border-slate-300 dark:border-slate-600"
								title="Rotate image"
							>
								<RotateCw className="w-3 h-3" />
							</Button>
						)}

						{canFullscreen && imageState.viewMode === "preview" && (
							<Button
								variant="outline"
								size="sm"
								onClick={handleFullscreen}
								className="h-8 px-3 text-xs font-medium gap-1.5 border-slate-300 dark:border-slate-600"
								title={
									imageState.isFullscreen
										? "Exit fullscreen"
										: "Enter fullscreen"
								}
							>
								{imageState.isFullscreen ? (
									<Minimize className="w-3 h-3" />
								) : (
									<Maximize className="w-3 h-3" />
								)}
							</Button>
						)}
					</div>
				</div>
			)}

			{/* Main content area */}
			<div className="flex-1 min-h-0">
				{imageState.viewMode === "preview" ? (
					<div className="h-full bg-gradient-to-br from-slate-100 to-white dark:from-slate-900 dark:to-slate-950 p-4">
						<div className="h-full bg-white dark:bg-slate-800 rounded border-2 border-slate-200 dark:border-slate-600 overflow-hidden">
							{renderImageContent()}
						</div>
					</div>
				) : (
					renderInfoPanel()
				)}
			</div>

			{/* Modern status bar */}
			{imageState.viewMode === "preview" && (
				<div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<div
								className={`w-2 h-2 rounded-full ${
									imageState.loaded ? "bg-green-500" : "bg-yellow-500"
								}`}
							/>
							<span>{imageState.loaded ? "Ready" : "Loading..."}</span>
						</div>
						<span>{imageState.zoom}% zoom</span>
						{imageState.rotation !== 0 && (
							<span>{imageState.rotation}° rotation</span>
						)}
					</div>
					<div className="flex items-center gap-3">
						{imageState.copyStatus === "copied" && (
							<Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
								✓ Copied to clipboard
							</Badge>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
