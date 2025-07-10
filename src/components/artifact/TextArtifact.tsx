// components/artifact/TextArtifact.tsx
"use client";

import { motion } from "framer-motion";
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
							<pre className="whitespace-pre-wrap font-mono text-xs text-foreground/90 leading-6 overflow-auto max-h-[calc(100vh-12rem)]">
								{content}
							</pre>
						</motion.div>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
