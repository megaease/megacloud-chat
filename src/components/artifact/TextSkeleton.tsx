"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface TextSkeletonProps {
	className?: string;
}

export function TextSkeleton({ className }: TextSkeletonProps) {
	const t = useTranslations("Artifact");

	return (
		<div className={cn("h-full bg-background", className)}>
			<div className="p-6 md:px-12 lg:px-20 max-w-4xl mx-auto space-y-6">
				{/* 标题骨架 */}
				<motion.div
					className="h-8 bg-muted rounded w-2/3"
					animate={{ opacity: [0.3, 0.7, 0.3] }}
					transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
				/>

				{/* 段落骨架 */}
				<div className="space-y-4">
					{[
						{ lines: [90, 85, 70], spacing: "mb-6" },
						{ lines: [95, 80, 88, 60], spacing: "mb-6" },
						{ lines: [75, 90, 85], spacing: "mb-6" },
						{ lines: [88, 92, 78, 85, 45], spacing: "mb-4" }
					].map((paragraph, pIndex) => (
						<div key={pIndex} className={`space-y-3 ${paragraph.spacing}`}>
							{paragraph.lines.map((width, lIndex) => (
								<motion.div
									key={lIndex}
									className="h-4 bg-muted rounded"
									style={{ width: `${width}%` }}
									animate={{ opacity: [0.4, 0.8, 0.4] }}
									transition={{ 
										duration: 1.8, 
										repeat: Infinity, 
										ease: "easeInOut",
										delay: (pIndex * paragraph.lines.length + lIndex) * 0.1 
									}}
								/>
							))}
						</div>
					))}
				</div>

				{/* 引用块骨架 */}
				<div className="border-l-4 border-muted pl-4 py-2 bg-muted/10 rounded-r">
					<div className="space-y-2">
						{[80, 90, 65].map((width, i) => (
							<motion.div
								key={i}
								className="h-4 bg-muted rounded"
								style={{ width: `${width}%` }}
								animate={{ opacity: [0.3, 0.7, 0.3] }}
								transition={{ 
									duration: 2.2, 
									repeat: Infinity, 
									ease: "easeInOut",
									delay: i * 0.15 
								}}
							/>
						))}
					</div>
				</div>

				{/* 列表骨架 */}
				<div className="space-y-2">
					{[1, 2, 3].map((i) => (
						<div key={i} className="flex items-start gap-3">
							<motion.div
								className="w-2 h-2 bg-muted rounded-full mt-2"
								animate={{ opacity: [0.4, 0.8, 0.4] }}
								transition={{ 
									duration: 1.5, 
									repeat: Infinity, 
									ease: "easeInOut",
									delay: i * 0.2 
								}}
							/>
							<motion.div
								className="h-4 bg-muted rounded flex-1"
								style={{ width: `${85 - i * 10}%` }}
								animate={{ opacity: [0.4, 0.8, 0.4] }}
								transition={{ 
									duration: 1.8, 
									repeat: Infinity, 
									ease: "easeInOut",
									delay: i * 0.2 + 0.1 
								}}
							/>
						</div>
					))}
				</div>

				{/* 代码块骨架 */}
				<div className="bg-muted/30 border rounded-lg p-4">
					<div className="space-y-2 font-mono">
						{[70, 85, 60, 90].map((width, i) => (
							<motion.div
								key={i}
								className="h-4 bg-muted rounded"
								style={{ width: `${width}%` }}
								animate={{ opacity: [0.3, 0.7, 0.3] }}
								transition={{ 
									duration: 2, 
									repeat: Infinity, 
									ease: "easeInOut",
									delay: i * 0.1 
								}}
							/>
						))}
					</div>
				</div>

				{/* 底部动画指示器 */}
				<div className="flex items-center justify-center gap-2 pt-8">
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

			{/* 流式传输提示 */}
			<div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-background/80 backdrop-blur-sm border rounded-full shadow-lg">
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
