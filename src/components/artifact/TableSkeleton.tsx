"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface TableSkeletonProps {
	className?: string;
}

export function TableSkeleton({ className }: TableSkeletonProps) {
	const t = useTranslations("Artifact");

	return (
		<div className={cn("h-full bg-background p-4", className)}>
			{/* 表格头部 */}
			<div className="mb-4">
				<motion.div
					className="h-6 bg-muted rounded w-1/3 mb-2"
					animate={{ opacity: [0.3, 0.7, 0.3] }}
					transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
				/>
				<motion.div
					className="h-4 bg-muted rounded w-1/2"
					animate={{ opacity: [0.4, 0.8, 0.4] }}
					transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
				/>
			</div>

			{/* 表格骨架 */}
			<div className="border rounded-lg overflow-hidden">
				{/* 表头 */}
				<div className="bg-muted/30 border-b">
					<div className="grid grid-cols-4 gap-4 p-3">
						{[1, 2, 3, 4].map((i) => (
							<motion.div
								key={i}
								className="h-5 bg-muted rounded"
								animate={{ opacity: [0.4, 0.8, 0.4] }}
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

				{/* 表格行 */}
				{[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
					<div key={row} className="border-b last:border-b-0">
						<div className="grid grid-cols-4 gap-4 p-3">
							{[1, 2, 3, 4].map((col) => (
								<motion.div
									key={col}
									className="h-4 bg-muted rounded"
									style={{ 
										width: `${Math.random() * 40 + 60}%` 
									}}
									animate={{ opacity: [0.3, 0.7, 0.3] }}
									transition={{ 
										duration: 2.2, 
										repeat: Infinity, 
										ease: "easeInOut",
										delay: (row * 4 + col) * 0.05 
									}}
								/>
							))}
						</div>
					</div>
				))}
			</div>

			{/* 分页骨架 */}
			<div className="mt-4 flex items-center justify-between">
				<motion.div
					className="h-4 bg-muted rounded w-32"
					animate={{ opacity: [0.4, 0.8, 0.4] }}
					transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
				/>
				<div className="flex items-center gap-2">
					{[1, 2, 3].map((i) => (
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
