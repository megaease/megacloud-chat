"use client";

import { motion } from "framer-motion";
import { AlertTriangle, FileText } from "lucide-react";
import type { VisualState } from "../VisualPreview";

interface SvgRendererProps {
	content: string;
	visualState: VisualState;
}

export function SvgRenderer({ content, visualState }: SvgRendererProps) {
	// 检查 SVG 内容是否有效
	const isSvgValid = () => {
		if (!content) return false;

		// 基本的 SVG 格式检查
		const trimmedContent = content.trim();
		return (
			trimmedContent.startsWith("<svg") && trimmedContent.includes("</svg>")
		);
	};

	const isValid = isSvgValid();

	// 如果 SVG 无效，显示错误状态
	if (!isValid) {
		return (
			<motion.div
				className="flex flex-col items-center justify-center p-8 text-center space-y-4"
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.3 }}
			>
				<div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/20 rounded-2xl flex items-center justify-center">
					<AlertTriangle className="w-8 h-8 text-orange-500" />
				</div>
				<div className="space-y-2">
					<h3 className="text-lg font-semibold text-foreground">
						SVG 格式无效
					</h3>
					<p className="text-sm text-muted-foreground max-w-md">
						提供的内容不是有效的 SVG 格式。请确保内容包含完整的 SVG 标签。
					</p>
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			className="relative max-w-full max-h-full flex items-center justify-center"
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.5, ease: "easeOut" }}
		>
			<div
				className="max-w-[90vw] max-h-[80vh] shadow-lg rounded-lg overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
				dangerouslySetInnerHTML={{ __html: content }}
			/>
		</motion.div>
	);
}
