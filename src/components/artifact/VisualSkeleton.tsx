"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { VisualContentType } from "./previews/VisualPreview";

interface VisualSkeletonProps {
	className?: string;
	contentType?: VisualContentType;
}

export function VisualSkeleton({ className, contentType = "unknown" }: VisualSkeletonProps) {
	const t = useTranslations("Artifact");

	const renderSkeletonContent = () => {
		switch (contentType) {
			case "chart":
				return (
					<div className="relative">
						<motion.div
							className="aspect-video bg-gradient-to-br from-muted/50 to-muted rounded-lg border border-muted-foreground/10"
							animate={{ opacity: [0.3, 0.7, 0.3] }}
							transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
						>
							{/* 模拟图表元素 */}
							<div className="absolute inset-4 space-y-3">
								{/* 模拟图表标题 */}
								<motion.div
									className="h-4 bg-muted-foreground/20 rounded w-1/3"
									animate={{ opacity: [0.4, 0.8, 0.4] }}
									transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
								/>
								
								{/* 模拟图表内容 */}
								<div className="flex items-end gap-2 h-32 pt-4">
									{[60, 80, 45, 90, 70, 55, 85].map((height, i) => (
										<motion.div
											key={i}
											className="flex-1 bg-primary/20 rounded-t"
											style={{ height: `${height}%` }}
											animate={{ 
												height: [`${height * 0.7}%`, `${height}%`, `${height * 0.8}%`],
												opacity: [0.3, 0.6, 0.3] 
											}}
											transition={{ 
												duration: 2.5, 
												repeat: Infinity, 
												ease: "easeInOut",
												delay: i * 0.1 
											}}
										/>
									))}
								</div>
							</div>
						</motion.div>
						
						{/* 图例骨架 */}
						<div className="flex items-center justify-center gap-4 mt-4">
							{[1, 2, 3].map((i) => (
								<div key={i} className="flex items-center gap-2">
									<motion.div
										className="w-3 h-3 rounded-full bg-primary/30"
										animate={{ opacity: [0.4, 0.8, 0.4] }}
										transition={{ 
											duration: 1.8, 
											repeat: Infinity, 
											ease: "easeInOut",
											delay: i * 0.3 
										}}
									/>
									<motion.div
										className="h-3 bg-muted rounded w-12"
										animate={{ opacity: [0.4, 0.8, 0.4] }}
										transition={{ 
											duration: 1.8, 
											repeat: Infinity, 
											ease: "easeInOut",
											delay: i * 0.3 + 0.1 
										}}
									/>
								</div>
							))}
						</div>
					</div>
				);
			
			case "image":
				return (
					<div className="relative">
						<motion.div
							className="aspect-video bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg border border-muted-foreground/10 flex items-center justify-center"
							animate={{ opacity: [0.3, 0.7, 0.3] }}
							transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
						>
							{/* 图片图标 */}
							<motion.div
								className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center"
								animate={{ scale: [0.9, 1.1, 0.9] }}
								transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
							>
								<span className="text-2xl">🖼️</span>
							</motion.div>
						</motion.div>
						
						{/* 模拟加载进度 */}
						<div className="mt-4 space-y-2">
							<motion.div
								className="h-2 bg-muted rounded-full overflow-hidden"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.5 }}
							>
								<motion.div
									className="h-full bg-primary/50 rounded-full"
									animate={{ width: ["0%", "100%"] }}
									transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
								/>
							</motion.div>
						</div>
					</div>
				);
			
			case "svg":
				return (
					<div className="relative">
						<motion.div
							className="aspect-video bg-gradient-to-br from-muted/40 to-muted/70 rounded-lg border border-muted-foreground/10 flex items-center justify-center"
							animate={{ opacity: [0.3, 0.7, 0.3] }}
							transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
						>
							{/* SVG 图形模拟 */}
							<div className="relative w-32 h-32">
								{/* 模拟 SVG 路径 */}
								<motion.div
									className="absolute inset-0 border-2 border-primary/30 rounded-full"
									animate={{ 
										rotate: [0, 360],
										scale: [0.8, 1.2, 0.8] 
									}}
									transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
								/>
								<motion.div
									className="absolute inset-4 border-2 border-primary/50 rounded-lg"
									animate={{ 
										rotate: [360, 0],
										scale: [1.2, 0.8, 1.2] 
									}}
									transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
								/>
								<motion.div
									className="absolute inset-8 bg-primary/20 rounded-full"
									animate={{ opacity: [0.2, 0.8, 0.2] }}
									transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
								/>
							</div>
						</motion.div>
					</div>
				);
			
			default:
				return (
					<div className="relative">
						<motion.div
							className="aspect-video bg-gradient-to-br from-muted/50 to-muted rounded-lg border border-muted-foreground/10"
							animate={{ opacity: [0.3, 0.7, 0.3] }}
							transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
						>
							{/* 通用内容骨架 */}
							<div className="absolute inset-4 space-y-4">
								<motion.div
									className="h-6 bg-muted-foreground/20 rounded w-1/2"
									animate={{ opacity: [0.4, 0.8, 0.4] }}
									transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
								/>
								<div className="space-y-2">
									{[80, 60, 90, 45].map((width, i) => (
										<motion.div
											key={i}
											className="h-3 bg-muted-foreground/15 rounded"
											style={{ width: `${width}%` }}
											animate={{ opacity: [0.3, 0.7, 0.3] }}
											transition={{ 
												duration: 1.8, 
												repeat: Infinity, 
												ease: "easeInOut",
												delay: i * 0.1 
											}}
										/>
									))}
								</div>
							</div>
						</motion.div>
					</div>
				);
		}
	};

	return (
		<div className={cn("h-full flex flex-col bg-background", className)}>
			{/* 工具栏骨架 */}
			<div className="flex items-center justify-between p-4 border-b">
				<div className="flex items-center gap-3">
					{/* 标题骨架 */}
					<motion.div
						className="h-4 bg-muted rounded w-32"
						animate={{ opacity: [0.5, 1, 0.5] }}
						transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
					/>
				</div>
				
				{/* 工具按钮骨架 */}
				<div className="flex items-center gap-2">
					{[1, 2, 3, 4].map((i) => (
						<motion.div
							key={i}
							className="w-8 h-8 bg-muted rounded"
							animate={{ opacity: [0.5, 1, 0.5] }}
							transition={{ 
								duration: 1.5, 
								repeat: Infinity, 
								ease: "easeInOut",
								delay: i * 0.1 
							}}
						/>
					))}
				</div>
			</div>

			{/* 内容区域骨架 */}
			<div className="flex-1 p-8 flex items-center justify-center">
				<div className="max-w-2xl w-full space-y-6">
					{renderSkeletonContent()}
					
					{/* 底部动画指示器 */}
					<div className="flex items-center justify-center gap-2 pt-4">
						{[0, 1, 2].map((i) => (
							<motion.div
								key={i}
								className="w-2 h-2 bg-primary/40 rounded-full"
								animate={{ 
									scale: [1, 1.2, 1],
									opacity: [0.3, 1, 0.3] 
								}}
								transition={{ 
									duration: 1.2, 
									repeat: Infinity, 
									ease: "easeInOut",
									delay: i * 0.2 
								}}
							/>
						))}
					</div>
				</div>
			</div>

			{/* 流式传输提示 */}
			<div className="px-4 py-3 border-t bg-muted/20">
				<div className="flex items-center gap-3">
					<motion.div
						className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
						animate={{ rotate: 360 }}
						transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
					/>
					<motion.span
						className="text-sm text-muted-foreground"
						animate={{ opacity: [0.6, 1, 0.6] }}
						transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
					>
						{t("generating")}
					</motion.span>
				</div>
			</div>
		</div>
	);
}
