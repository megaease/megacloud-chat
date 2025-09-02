// components/artifact/TextArtifact.tsx
"use client";

import { Markdown } from "@/components/prompt-kit/markdown";
import type { UIArtifact } from "@/lib/artifact-types";
import { motion } from "framer-motion";

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
	// 在流式传输时显示实时内容而不是骨架屏
	// 注释掉骨架屏，让用户可以看到文本逐步生成
	// if (status === "streaming") {
	// 	return <TextSkeleton />;
	// }

	return (
		<div className="h-full flex flex-col">
			<div className="flex-1 overflow-auto">
				<motion.div
					className="h-full"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3, ease: "easeInOut" }}
				>
					<div className="p-6 md:px-8 lg:px-10 max-w-4xl mx-auto">
						<motion.div
							initial={{ scale: 0.98, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
							className="p-6 relative bg-background"
						>
							<Markdown className="prose prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-h5:text-sm prose-h6:text-xs">
								{content}
							</Markdown>
						</motion.div>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
