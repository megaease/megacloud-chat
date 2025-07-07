"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface CodeSkeletonProps {
	className?: string;
	mode?: "code" | "preview";
}

export function CodeSkeleton({ className, mode = "code" }: CodeSkeletonProps) {
	const t = useTranslations("Artifact");

	if (mode === "code") {
		return (
			<div className={cn("h-full bg-background border rounded-lg overflow-hidden", className)}>
				{/* 代码编辑器头部 */}
				<div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
					<div className="flex items-center gap-2">
						{[1, 2, 3].map((i) => (
							<motion.div
								key={i}
								className="w-3 h-3 rounded-full bg-muted"
								animate={{ opacity: [0.3, 0.8, 0.3] }}
								transition={{ 
									duration: 1.5, 
									repeat: Infinity, 
									ease: "easeInOut",
									delay: i * 0.2 
								}}
							/>
						))}
					</div>
					<motion.div
						className="h-4 bg-muted rounded w-20"
						animate={{ opacity: [0.4, 0.8, 0.4] }}
						transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
					/>
				</div>

				{/* 代码行骨架 */}
				<div className="p-4 space-y-3 font-mono text-sm">
					{[
						{ width: "60%", delay: 0 },
						{ width: "80%", delay: 0.1 },
						{ width: "40%", delay: 0.2 },
						{ width: "90%", delay: 0.3 },
						{ width: "70%", delay: 0.4 },
						{ width: "50%", delay: 0.5 },
						{ width: "85%", delay: 0.6 },
						{ width: "30%", delay: 0.7 },
						{ width: "75%", delay: 0.8 },
						{ width: "95%", delay: 0.9 }
					].map((line, i) => (
						<div key={i} className="flex items-center gap-4">
							{/* 行号 */}
							<motion.div
								className="w-6 h-4 bg-muted/60 rounded text-right"
								animate={{ opacity: [0.3, 0.7, 0.3] }}
								transition={{ 
									duration: 2, 
									repeat: Infinity, 
									ease: "easeInOut",
									delay: line.delay 
								}}
							/>
							{/* 代码内容 */}
							<motion.div
								className="h-4 bg-muted rounded"
								style={{ width: line.width }}
								animate={{ opacity: [0.4, 0.8, 0.4] }}
								transition={{ 
									duration: 1.8, 
									repeat: Infinity, 
									ease: "easeInOut",
									delay: line.delay + 0.1 
								}}
							/>
						</div>
					))}
				</div>

				{/* 底部状态栏 */}
				<div className="absolute bottom-0 left-0 right-0 px-4 py-2 border-t bg-muted/10">
					<div className="flex items-center gap-3">
						<motion.div
							className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
							animate={{ rotate: 360 }}
							transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
						/>
						<motion.span
							className="text-xs text-muted-foreground"
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

	// Preview mode skeleton
	return (
		<div className={cn("h-full bg-background border rounded-lg overflow-hidden", className)}>
			{/* 预览头部 */}
			<div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
				<motion.div
					className="h-5 bg-muted rounded w-32"
					animate={{ opacity: [0.4, 0.8, 0.4] }}
					transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
				/>
				<div className="flex items-center gap-2">
					{[1, 2].map((i) => (
						<motion.div
							key={i}
							className="w-8 h-8 bg-muted rounded"
							animate={{ opacity: [0.3, 0.7, 0.3] }}
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

			{/* 预览内容骨架 */}
			<div className="p-6 space-y-4">
				{/* 模拟网页/应用界面 */}
				<div className="space-y-4">
					<motion.div
						className="h-8 bg-muted rounded w-2/3"
						animate={{ opacity: [0.3, 0.7, 0.3] }}
						transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
					/>
					<div className="grid grid-cols-2 gap-4">
						{[1, 2].map((i) => (
							<motion.div
								key={i}
								className="aspect-video bg-muted rounded-lg"
								animate={{ opacity: [0.2, 0.6, 0.2] }}
								transition={{ 
									duration: 2.5, 
									repeat: Infinity, 
									ease: "easeInOut",
									delay: i * 0.3 
								}}
							/>
						))}
					</div>
					<div className="space-y-2">
						{[60, 80, 45].map((width, i) => (
							<motion.div
								key={i}
								className="h-4 bg-muted rounded"
								style={{ width: `${width}%` }}
								animate={{ opacity: [0.4, 0.8, 0.4] }}
								transition={{ 
									duration: 1.8, 
									repeat: Infinity, 
									ease: "easeInOut",
									delay: i * 0.2 
								}}
							/>
						))}
					</div>
				</div>
			</div>

			{/* 底部状态 */}
			<div className="absolute bottom-0 left-0 right-0 px-4 py-2 border-t bg-muted/10">
				<div className="flex items-center gap-3">
					<motion.div
						className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
						animate={{ rotate: 360 }}
						transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
					/>
					<motion.span
						className="text-xs text-muted-foreground"
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
