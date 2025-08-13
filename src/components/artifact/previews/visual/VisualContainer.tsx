"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { VisualContentType, VisualState } from "../VisualPreview";

interface VisualContainerProps {
	children: ReactNode;
	visualState: VisualState;
	updateVisualState: (updates: Partial<VisualState>) => void;
	contentType?: VisualContentType;
	className?: string;
}

export function VisualContainer({
	children,
	visualState,
	updateVisualState,
	contentType = "unknown",
	className,
}: VisualContainerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const { zoom, rotation, isFullscreen } = visualState;

	// 滚轮缩放 - 仅对图片和 SVG 有效
	const handleWheel = useCallback(
		(e: WheelEvent) => {
			if (contentType !== "chart" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				const delta = -e.deltaY;
				const zoomStep = 10;
				const newZoom = Math.max(
					25,
					Math.min(500, zoom + (delta > 0 ? zoomStep : -zoomStep)),
				);
				updateVisualState({ zoom: newZoom });
			}
		},
		[zoom, updateVisualState, contentType],
	);

	// 绑定滚轮事件
	useEffect(() => {
		const container = containerRef.current;
		if (container) {
			container.addEventListener("wheel", handleWheel, { passive: false });
			return () => container.removeEventListener("wheel", handleWheel);
		}
	}, [handleWheel]);

	// 处理全屏模式下的键盘事件
	useEffect(() => {
		if (!isFullscreen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			switch (e.key) {
				case "Escape":
					updateVisualState({ isFullscreen: false });
					break;
				case "=":
				case "+":
					if (contentType !== "chart" && (e.ctrlKey || e.metaKey)) {
						e.preventDefault();
						updateVisualState({ zoom: Math.min(500, zoom + 25) });
					}
					break;
				case "-":
					if (contentType !== "chart" && (e.ctrlKey || e.metaKey)) {
						e.preventDefault();
						updateVisualState({ zoom: Math.max(25, zoom - 25) });
					}
					break;
				case "0":
					if (contentType !== "chart" && (e.ctrlKey || e.metaKey)) {
						e.preventDefault();
						updateVisualState({ zoom: 100, rotation: 0 });
					}
					break;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isFullscreen, zoom, updateVisualState, contentType]);

	const containerContent = (
		<div
			ref={containerRef}
			className={cn(
				"flex-1 overflow-auto flex items-center justify-center",
				"bg-background transition-colors duration-200",
				contentType === "chart" ? "p-0" : "p-4",
				isFullscreen && "h-screen bg-black/95 p-8",
				className,
			)}
		>
			{contentType === "chart" ? (
				// 图表不需要缩放和旋转变换，直接占满容器
				<div className="w-full h-full">{children}</div>
			) : (
				// 图片和 SVG 应用缩放和旋转变换
				<motion.div
					className="flex items-center justify-center"
					style={{
						transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
					}}
					transition={{
						type: "spring",
						stiffness: 300,
						damping: 30,
					}}
				>
					{children}
				</motion.div>
			)}
		</div>
	);

	// 全屏模式
	if (isFullscreen) {
		return (
			<Dialog
				open={isFullscreen}
				onOpenChange={(open) => updateVisualState({ isFullscreen: open })}
			>
				<DialogContent
					className="max-w-none h-screen p-0 bg-black/95 border-none"
					showCloseButton={false}
				>
					<DialogTitle className="sr-only">全屏预览</DialogTitle>
					{containerContent}
				</DialogContent>
			</Dialog>
		);
	}

	return containerContent;
}
