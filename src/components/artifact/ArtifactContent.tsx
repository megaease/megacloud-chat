// components/artifact/ArtifactContent.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ArtifactLanguage } from "@/lib/artifact-types";
import { TextArtifact } from "./TextArtifact";
import { CodePreview } from "./CodePreview";
import { useArtifact } from "@/context/artifact-provider-context";

export function ArtifactContent({
	viewMode = "code",
}: { viewMode?: "code" | "preview" }) {
	const { artifact } = useArtifact();

	// 直接使用 artifact context 中的数据
	const displayData = {
		kind: artifact.kind,
		content: artifact.content,
		title: artifact.title,
		language: artifact.language,
	};

	const displayStatus = artifact.status;

	// 创建一个更稳定的 key，只在内容真正变化时才触发动画
	// 不包含 status，避免状态切换时重新挂载组件
	const contentKey = `${displayData.kind}-${displayData.content?.slice(0, 100) || ''}`;

	// Render content based on kind
	const renderContent = () => {
		// 如果是 error 状态，显示错误信息
		if (displayStatus === "error") {
			return (
				<motion.div 
					className="h-full flex items-center justify-center"
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.3, ease: "easeOut" }}
				>
					<div className="bg-gradient-to-br from-red-50/50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/20 rounded-xl border border-red-200/50 dark:border-red-800/50 backdrop-blur-sm w-full h-full flex items-center justify-center">
						<div className="text-center space-y-6 p-8">
							<motion.div 
								className="relative"
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
							>
								<div className="w-16 h-16 mx-auto bg-red-100/80 dark:bg-red-900/80 rounded-2xl flex items-center justify-center shadow-lg">
									<span className="text-3xl">⚠️</span>
								</div>
							</motion.div>
							<motion.div 
								className="space-y-3"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2, duration: 0.3 }}
							>
								<p className="text-sm font-semibold text-red-800 dark:text-red-200">
									Failed to load content
								</p>
								<p className="text-xs text-red-600/80 dark:text-red-400/80 max-w-xs mx-auto leading-relaxed">
									{displayData.content ||
										"An error occurred while loading the document"}
								</p>
							</motion.div>
						</div>
					</div>
				</motion.div>
			);
		}



		switch (displayData.kind) {
			case "code":
				return (
					<motion.div
						className="h-full"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
					>
						<CodePreview
							content={displayData.content}
							language={displayData.language}
							className="h-full"
							mode={viewMode}
						/>
					</motion.div>
				);

			case "text":
				return (
					<motion.div
						className="h-full"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
					>
						<TextArtifact
							content={displayData.content}
							title={displayData.title}
							status={displayStatus}
						/>
					</motion.div>
				);

			case "sheet":
				return (
					<motion.div className="h-full flex flex-col bg-background">
						<motion.div 
							className="flex-1 p-6 md:px-12 lg:px-20 overflow-auto"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, ease: "easeOut" }}
						>
							<div className="max-w-4xl mx-auto">
								<motion.div 
									className="bg-card/60 backdrop-blur-sm border rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl hover:bg-card/80"
									initial={{ scale: 0.98 }}
									animate={{ scale: 1 }}
									transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
								>
									<pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
										{displayData.content}
									</pre>
								</motion.div>
							</div>
						</motion.div>
					</motion.div>
				);

			default:
				return (
					<motion.div 
						className="h-full flex items-center justify-center"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
					>
						<div className="bg-gradient-to-br from-muted/10 to-muted/30 rounded-xl border border-border/50 backdrop-blur-sm w-full h-full flex items-center justify-center">
							<div className="text-center space-y-6 p-8">
								<motion.div 
									className="relative"
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
								>
									<div className="w-20 h-20 mx-auto bg-muted/30 rounded-2xl flex items-center justify-center shadow-lg">
										<span className="text-3xl">📄</span>
									</div>
									<div className="absolute inset-0 w-20 h-20 mx-auto border-2 border-dashed border-muted-foreground/30 rounded-2xl" />
								</motion.div>
								<motion.div 
									className="space-y-3"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.2, duration: 0.3 }}
								>
									<p className="text-sm font-semibold text-foreground">
										Unsupported Content Type
									</p>
									<p className="text-xs text-muted-foreground/80 max-w-xs mx-auto leading-relaxed">
										The content type "{displayData.kind}" is not currently
										supported
									</p>
								</motion.div>
							</div>
						</div>
					</motion.div>
				);
		}
	};

	return (
		<div className="h-full relative">
			<AnimatePresence mode="wait">
				<motion.div
					key={contentKey}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2, ease: "easeInOut" }}
					className="h-full"
				>
					{renderContent()}
				</motion.div>
			</AnimatePresence>
			
			{/* 状态过渡指示器 - 包含骨架屏 */}
			<AnimatePresence>
				{(displayStatus === "creating" || displayStatus === "updating" || displayStatus === "loading") && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10"
					>
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.8, opacity: 0 }}
							transition={{ duration: 0.3, ease: "easeOut" }}
							className="bg-card/90 rounded-2xl p-6 shadow-2xl border border-border/50 backdrop-blur-md"
						>
							<div className="flex items-center gap-4">
								<motion.div
									animate={{ rotate: 360 }}
									transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
									className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
								/>
								<span className="text-sm font-medium text-foreground">
									{displayStatus === "creating" && "Creating content..."}
									{displayStatus === "updating" && "Updating content..."}
									{displayStatus === "loading" && "Loading content..."}
								</span>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
