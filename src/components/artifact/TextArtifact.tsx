// components/artifact/TextArtifact.tsx
"use client";

import { Markdown } from "@/components/markdown";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TextSkeleton } from "./TextSkeleton";
import type { UIArtifact } from "@/lib/artifact-types";

interface TextArtifactProps {
	content: string;
	title: string;
	status?: UIArtifact["status"];
}

export function TextArtifact({
	content,
	title,
	status = "idle",
}: TextArtifactProps) {
	const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");

	// 如果正在流式传输，显示骨架屏
	if (status === "streaming") {
		return <TextSkeleton />;
	}

	const renderContent = () => {
		if (viewMode === "rendered") {
			return (
				<motion.div 
					className="h-full"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3, ease: "easeInOut" }}
				>
					<div className="p-6 md:px-12 lg:px-20 max-w-4xl mx-auto">
						<motion.div 
							className="prose prose-sm max-w-none dark:prose-invert 
							prose-headings:scroll-m-20 prose-h1:text-xl prose-h1:font-semibold prose-h1:mb-4
							prose-h2:text-lg prose-h2:font-medium prose-h2:mb-3 prose-h3:text-base prose-h3:font-medium prose-h3:mb-2
							prose-p:leading-6 prose-p:mb-3 prose-p:text-sm
							prose-blockquote:border-l-2 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
							prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
							prose-pre:bg-muted/30 prose-pre:border prose-pre:rounded-lg prose-pre:p-4 prose-pre:text-xs prose-pre:leading-5
							prose-ul:my-4 prose-ol:my-4 prose-li:my-1 prose-li:text-sm
							prose-strong:font-medium prose-em:italic"
							initial={{ y: 10, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
						>
							{/* Force re-render by using key with content length */}
							<Markdown key={content.length} content={content} />
						</motion.div>
					</div>
				</motion.div>
			);
		}

		return (
			<motion.div 
				className="h-full"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, ease: "easeInOut" }}
			>
				<div className="p-6 md:px-12 lg:px-20 max-w-4xl mx-auto">
					<motion.div
						initial={{ scale: 0.98, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
					>
						<Card className="p-6 relative bg-card/50 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all duration-300">
							<pre className="whitespace-pre-wrap font-mono text-xs text-foreground/90 leading-6 overflow-auto max-h-[calc(100vh-12rem)]">
								{content}
							</pre>
						</Card>
					</motion.div>
				</div>
			</motion.div>
		);
	};

	return (
		<div className="h-full flex flex-col">
			{/* Content area */}
			<div className="flex-1 overflow-auto">{renderContent()}</div>
		</div>
	);
}
