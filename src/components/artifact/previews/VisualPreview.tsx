"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { VisualSkeleton } from "../VisualSkeleton";
// 子组件导入
import { VisualToolbar } from "./visual";
import { ImageRenderer } from "./visual";
import { SvgRenderer } from "./visual";
import { ChartRenderer } from "./visual";
import { VisualContainer } from "./visual";

// 类型定义
export type VisualContentType = "image" | "svg" | "chart" | "none" | "unknown";

export interface VisualPreviewProps {
	content: string;
	title?: string;
	className?: string;
	status?: "idle" | "streaming" | "error" | "loading";
	showToolbar?: boolean;
}

export interface VisualState {
	zoom: number;
	rotation: number;
	isFullscreen: boolean;
	loaded: boolean;
	error: boolean;
	copyStatus: "idle" | "copied";
}

// 内容类型检测 Hook
export function useContentTypeDetection(content: string): VisualContentType {
	return useMemo(() => {
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

export function VisualPreview({
	content,
	title,
	className,
	status = "idle",
	showToolbar = true,
}: VisualPreviewProps) {
	// 状态管理
	const [visualState, setVisualState] = useState<VisualState>({
		zoom: 100,
		rotation: 0,
		isFullscreen: false,
		loaded: false,
		error: false,
		copyStatus: "idle",
	});

	// Force re-render key to ensure component re-renders when content changes
	const [renderKey, setRenderKey] = useState(0);

	const imageRef = useRef<HTMLImageElement>(null);
	const contentType = useContentTypeDetection(content);

	// 当内容发生变化时，强制重新渲染
	useEffect(() => {
		setRenderKey((prev) => prev + 1);
		// 重置加载状态，让组件重新初始化
		setVisualState((prev) => ({
			...prev,
			loaded: false,
			error: false,
		}));
	}, [content]);

	// 状态更新函数
	const updateVisualState = useCallback((updates: Partial<VisualState>) => {
		setVisualState((prev) => ({ ...prev, ...updates }));
	}, []);

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

	// 对于 SVG 和图表内容，立即设置为已加载
	useEffect(() => {
		if (contentType === "svg" || contentType === "chart") {
			updateVisualState({ loaded: true, error: false });
		}
	}, [contentType, updateVisualState]);

	const imageSrc = getImageSrc();

	// 如果正在流式传输，显示骨架屏
	if (status === "streaming") {
		return <VisualSkeleton className={className} contentType={contentType} />;
	}

	// 如果真的没有任何内容
	if (!content || content.trim() === "" || contentType === "none") {
		return (
			<div className={cn("h-full flex items-center justify-center", className)}>
				<motion.div
					className="text-center space-y-4 p-8"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
				>
					<div className="w-16 h-16 mx-auto bg-muted rounded-2xl flex items-center justify-center">
						<span className="text-2xl">📊</span>
					</div>
					<div className="space-y-2">
						<h3 className="text-lg font-semibold text-foreground">
							No Visual Content
						</h3>
						<p className="text-sm text-muted-foreground">
							No visual content available
						</p>
					</div>
				</motion.div>
			</div>
		);
	}

	return (
		<div
			key={renderKey}
			className={cn("h-full flex flex-col bg-background", className)}
		>
			{/* 工具栏 */}
			{showToolbar && (
				<VisualToolbar
					contentType={contentType}
					title={title}
					visualState={visualState}
					updateVisualState={updateVisualState}
					imageSrc={imageSrc}
					imageRef={imageRef}
					content={content}
				/>
			)}

			{/* 内容预览区域 */}
			<VisualContainer
				visualState={visualState}
				updateVisualState={updateVisualState}
				contentType={contentType}
			>
				{/* 根据内容类型渲染不同组件 */}
				{contentType === "chart" ? (
					<ChartRenderer
						content={content}
						visualState={visualState}
						updateVisualState={updateVisualState}
					/>
				) : contentType === "svg" ? (
					<SvgRenderer content={content} visualState={visualState} />
				) : (
					<ImageRenderer
						imageSrc={imageSrc}
						title={title}
						visualState={visualState}
						updateVisualState={updateVisualState}
						imageRef={imageRef}
					/>
				)}
			</VisualContainer>
		</div>
	);
}
