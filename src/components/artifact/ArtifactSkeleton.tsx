// components/artifact/ArtifactSkeleton.tsx
"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";

interface ArtifactSkeletonProps {
	title?: string;
	showTitle?: boolean;
}

export function ArtifactSkeleton({
	title,
	showTitle = false,
}: ArtifactSkeletonProps) {
	return (
		<div className="h-full bg-background flex flex-col">
			{/* 中央内容区域 */}
			<div className="flex-1 flex items-center justify-center">
				<div className="flex flex-col items-center space-y-6 max-w-md mx-auto px-8">
					{/* 旋转的图标 */}
					<motion.div
						className="relative"
						animate={{ rotate: 360 }}
						transition={{
							duration: 3,
							repeat: Number.POSITIVE_INFINITY,
							ease: "linear",
						}}
					>
						<div className="w-16 h-16 rounded-full border-2 border-muted/20 flex items-center justify-center">
							<FileText className="w-8 h-8 text-muted-foreground" />
						</div>
						<motion.div
							className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-primary"
							animate={{ rotate: 360 }}
							transition={{
								duration: 1.5,
								repeat: Number.POSITIVE_INFINITY,
								ease: "linear",
							}}
						/>
					</motion.div>

					{/* 标题和状态文字 */}
					<motion.div
						className="text-center space-y-3"
						animate={{ opacity: [0.7, 1, 0.7] }}
						transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
					>
						{/* 如果有标题，显示标题 */}
						{showTitle && title && (
							<h2 className="text-xl font-semibold text-foreground">{title}</h2>
						)}

						{/* 状态描述 */}
						<div className="space-y-2">
							<h3 className="text-base font-medium text-muted-foreground">
								{showTitle && title
									? "Generating content..."
									: "Preparing artifact..."}
							</h3>
							<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/70">
								<motion.div
									className="w-2 h-2 bg-blue-500 rounded-full"
									animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
									transition={{
										duration: 1.5,
										repeat: Number.POSITIVE_INFINITY,
									}}
								/>
								<span>Please wait while we prepare your content</span>
							</div>
						</div>
					</motion.div>

					{/* 简化的骨架行 */}
					<div className="w-full space-y-3 mt-8">
						{[
							{ width: "80%", delay: 0, id: "line-1" },
							{ width: "60%", delay: 0.1, id: "line-2" },
							{ width: "70%", delay: 0.2, id: "line-3" },
						].map((line) => (
							<motion.div
								key={line.id}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: line.delay, duration: 0.4 }}
								className="flex justify-center"
							>
								<Skeleton className="h-3" style={{ width: line.width }} />
							</motion.div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
