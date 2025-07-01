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

	// 创建一个唯一的 key 来触发动画，当内容真正变化时
	const contentKey = `${displayData.kind}-${displayStatus}-${displayData.content?.slice(0, 50)}`;

	// Render content based on kind
	const renderContent = () => {
		// 如果是 loading 状态，显示加载界面
		if (displayStatus === "loading") {
			return (
				<div className="h-full flex items-center justify-center bg-gradient-to-br from-muted/5 to-muted/15">
					<div className="text-center space-y-4 p-8">
						<div className="relative">
							<div className="w-12 h-12 mx-auto bg-muted/10 rounded-lg flex items-center justify-center animate-pulse">
								<span className="text-2xl">📄</span>
							</div>
						</div>
						<div className="space-y-2">
							<p className="text-sm font-medium text-foreground/80">
								Loading content...
							</p>
							<p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
								Please wait while we fetch your document
							</p>
						</div>
					</div>
				</div>
			);
		}

		// 如果是 error 状态，显示错误信息
		if (displayStatus === "error") {
			return (
				<div className="h-full flex items-center justify-center bg-gradient-to-br from-red-50/50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/20">
					<div className="text-center space-y-4 p-8">
						<div className="relative">
							<div className="w-12 h-12 mx-auto bg-red-100/50 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
								<span className="text-2xl">⚠️</span>
							</div>
						</div>
						<div className="space-y-2">
							<p className="text-sm font-medium text-red-800 dark:text-red-200">
								Failed to load content
							</p>
							<p className="text-xs text-red-600/70 dark:text-red-400/70 max-w-xs mx-auto">
								{displayData.content ||
									"An error occurred while loading the document"}
							</p>
						</div>
					</div>
				</div>
			);
		}

		// 如果是 streaming 状态但没有内容，显示一个简单的准备状态
		if (
			displayStatus === "streaming" &&
			(!displayData.content || displayData.content.trim() === "")
		) {
			return (
				<div className="h-full flex items-center justify-center bg-gradient-to-br from-muted/5 to-muted/15">
					<div className="text-center space-y-4 p-8">
						<div className="relative">
							<div className="w-12 h-12 mx-auto bg-muted/10 rounded-lg flex items-center justify-center">
								<span className="text-2xl">⚡</span>
							</div>
						</div>
						<div className="space-y-2">
							<p className="text-sm font-medium text-foreground/80">
								Content is being generated...
							</p>
							<p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
								Please wait while we create your content
							</p>
						</div>
					</div>
				</div>
			);
		}

		switch (displayData.kind) {
			case "code":
				return (
					<CodePreview
						content={displayData.content}
						language={displayData.language}
						className="h-full"
						mode={viewMode}
					/>
				);

			case "text":
				return (
					<TextArtifact
						content={displayData.content}
						title={displayData.title}
						status={displayStatus}
					/>
				);

			case "sheet":
				return (
					<div className="h-full flex flex-col bg-background">
						<div className="flex-1 p-6 md:px-12 lg:px-20 overflow-auto">
							<div className="max-w-4xl mx-auto">
								<div className="bg-card/50 backdrop-blur-sm border rounded-lg shadow-sm p-6">
									<pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
										{displayData.content}
									</pre>
								</div>
							</div>
						</div>
					</div>
				);

			default:
				return (
					<div className="h-full flex items-center justify-center bg-gradient-to-br from-muted/10 to-muted/30">
						<div className="text-center space-y-4 p-8">
							<div className="relative">
								<div className="w-16 h-16 mx-auto bg-muted/20 rounded-lg flex items-center justify-center">
									<span className="text-2xl">📄</span>
								</div>
								<div className="absolute inset-0 w-16 h-16 mx-auto border-2 border-dashed border-muted-foreground/20 rounded-lg" />
							</div>
							<div className="space-y-2">
								<p className="text-sm font-medium text-foreground">
									Unsupported Content Type
								</p>
								<p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
									The content type "{displayData.kind}" is not currently
									supported
								</p>
							</div>
						</div>
					</div>
				);
		}
	};

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={contentKey}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.15, ease: "easeInOut" }}
				className="h-full"
			>
				{renderContent()}
			</motion.div>
		</AnimatePresence>
	);
}
