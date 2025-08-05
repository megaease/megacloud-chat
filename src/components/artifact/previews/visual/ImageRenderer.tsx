"use client";

import { useState, type RefObject } from "react";
import { motion } from "framer-motion";
import { ImageIcon, AlertCircle } from "lucide-react";
import Image from "next/image";
import type { VisualState } from "../VisualPreview";

interface ImageRendererProps {
	imageSrc: string;
	title?: string;
	visualState: VisualState;
	updateVisualState: (updates: Partial<VisualState>) => void;
	imageRef?: RefObject<HTMLImageElement | null>;
}

export function ImageRenderer({
	imageSrc,
	title,
	visualState,
	updateVisualState,
	imageRef
}: ImageRendererProps) {
	const [imageError, setImageError] = useState(false);
	const { loaded, error } = visualState;

	const handleImageLoad = () => {
		updateVisualState({ loaded: true, error: false });
		setImageError(false);
	};

	const handleImageError = () => {
		updateVisualState({ loaded: true, error: true });
		setImageError(true);
	};

	// 如果加载错误，显示错误状态
	if (error || imageError) {
		return (
			<motion.div
				className="flex flex-col items-center justify-center p-8 text-center space-y-4"
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.3 }}
			>
				<div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 rounded-2xl flex items-center justify-center">
					<AlertCircle className="w-8 h-8 text-red-500" />
				</div>
				<div className="space-y-2">
					<h3 className="text-lg font-semibold text-foreground">
						图片加载失败
					</h3>
					<p className="text-sm text-muted-foreground max-w-md">
						无法加载图片。请检查图片链接是否有效，或者尝试重新上传图片。
					</p>
				</div>
			</motion.div>
		);
	}

	// 如果还在加载中，显示加载状态
	if (!loaded) {
		return (
			<motion.div
				className="flex flex-col items-center justify-center p-8 text-center space-y-4"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3 }}
			>
				<div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
					<motion.div
						animate={{ rotate: 360 }}
						transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
					>
						<ImageIcon className="w-8 h-8 text-muted-foreground" />
					</motion.div>
				</div>
				<div className="space-y-2">
					<h3 className="text-lg font-semibold text-foreground">
						加载中...
					</h3>
					<p className="text-sm text-muted-foreground">
						正在加载图片
					</p>
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			className="relative max-w-full max-h-full"
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.5, ease: "easeOut" }}
		>
			{/* 使用原生 img 标签以获得更好的控制 */}
			<img
				ref={imageRef}
				src={imageSrc}
				alt={title || "Image preview"}
				className="max-w-[90vw] max-h-[80vh] object-contain shadow-lg rounded-lg"
				onLoad={handleImageLoad}
				onError={handleImageError}
			/>
		</motion.div>
	);
}
