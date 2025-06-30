// components/artifact/ArtifactSkeleton.tsx
"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";

export function ArtifactSkeleton() {
	return (
		<div className="h-full bg-background flex flex-col">
			{/* 上部分：图标和文字 */}
			<div className="flex items-center justify-center py-12">
				<div className="flex flex-col items-center space-y-4">
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
						<div className="w-12 h-12 rounded-full border-2 border-muted/20 flex items-center justify-center">
							<FileText className="w-6 h-6 text-muted-foreground" />
						</div>
						<motion.div
							className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-primary"
							animate={{ rotate: 360 }}
							transition={{
								duration: 1.5,
								repeat: Number.POSITIVE_INFINITY,
								ease: "linear",
							}}
						/>
					</motion.div>

					{/* 中间文字 */}
					<motion.div
						className="text-center"
						animate={{ opacity: [0.7, 1, 0.7] }}
						transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
					>
						<h3 className="text-base font-medium text-muted-foreground">
							Generating content...
						</h3>
						<p className="text-sm text-muted-foreground/70 mt-1">
							Please wait while we prepare your artifact
						</p>
					</motion.div>
				</div>
			</div>

			{/* 下部分：骨架行 */}
			<div className="flex-1 px-8 pb-8">
				<div className="max-w-2xl mx-auto space-y-4">
					{/* 标题骨架 */}
					<div className="space-y-2">
						<Skeleton className="h-5 w-2/3" />
						<Skeleton className="h-4 w-1/2" />
					</div>

					{/* 内容骨架行 */}
					<div className="space-y-3 mt-6">
						{[
							{ width: "95%", delay: 0, id: "line-1" },
							{ width: "88%", delay: 0.1, id: "line-2" },
							{ width: "92%", delay: 0.2, id: "line-3" },
							{ width: "85%", delay: 0.3, id: "line-4" },
							{ width: "90%", delay: 0.4, id: "line-5" },
							{ width: "87%", delay: 0.5, id: "line-6" },
						].map((line) => (
							<motion.div
								key={line.id}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: line.delay, duration: 0.4 }}
							>
								<Skeleton 
									className="h-3" 
									style={{ width: line.width }} 
								/>
							</motion.div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
