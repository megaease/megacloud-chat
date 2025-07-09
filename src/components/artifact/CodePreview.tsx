"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { CodeEditor } from "@/components/code-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Eye, Copy, Check, Download, RefreshCw, Globe, Monitor, Smartphone, Tablet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	getLanguage,
	getPreviewType,
	getLanguageDisplayName,
	isPreviewSupported,
} from "./utils/language-detector";
import {
	HtmlPreview,
	ReactPreview,
	JavaScriptPreview,
	PythonPreview,
} from "./previews";
import { CodeSkeleton } from "./CodeSkeleton";
import type { ArtifactLanguage } from "@/lib/artifact-types";

interface CodePreviewProps {
	content: string;
	language?: ArtifactLanguage;
	className?: string;
	status?: "idle" | "streaming" | "error" | "loading";
}

export function CodePreview({
	content,
	language,
	className,
	status = "idle",
}: CodePreviewProps) {
	const tArtifact = useTranslations("Artifact");
	const tCommon = useTranslations("Common");
	const [viewMode, setViewMode] = useState<"code" | "preview">("preview");
	const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
	const [htmlViewMode, setHtmlViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");

	const finalLanguage = getLanguage(language, content);
	const previewType = getPreviewType(finalLanguage);
	const canPreview = isPreviewSupported(finalLanguage);

	// 如果正在流式传输，显示骨架屏
	if (status === "streaming") {
		return <CodeSkeleton className={className} />;
	}

	// 复制功能
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(content);
			setCopyStatus("copied");
			setTimeout(() => setCopyStatus("idle"), 2000);
		} catch (error) {
			console.error("Copy failed:", error);
		}
	};

	// 下载功能
	const handleDownload = () => {
		const getFileExtension = () => {
			switch (previewType) {
				case "html": return "html";
				case "react": return "jsx";
				case "javascript": return "js";
				case "python": return "py";
				default: return "txt";
			}
		};
		
		const getMimeType = () => {
			switch (previewType) {
				case "html": return "text/html";
				case "react": case "javascript": return "text/javascript";
				case "python": return "text/x-python";
				default: return "text/plain";
			}
		};

		const filename = `code.${getFileExtension()}`;
		const blob = new Blob([content], { type: getMimeType() });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const renderPreview = () => {
		switch (previewType) {
			case "html":
				return (
					<HtmlPreview 
						content={content} 
						showToolbar={false}
						viewMode={htmlViewMode}
						onViewModeChange={setHtmlViewMode}
					/>
				);
			case "react":
				return <ReactPreview content={content} showToolbar={false} />;
			case "javascript":
				return <JavaScriptPreview content={content} showToolbar={false} />;
			case "python":
				return <PythonPreview content={content} showToolbar={false} />;
			default:
				return (
					<motion.div
						className="flex items-center justify-center h-full text-muted-foreground"
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
									<Code2 className="w-20 h-20 mx-auto opacity-30" />
									<div className="absolute inset-0 w-20 h-20 mx-auto border-2 border-dashed border-muted-foreground/30 rounded-2xl" />
								</motion.div>
								<motion.div
									className="space-y-3"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.2, duration: 0.3 }}
								>
									<p className="text-sm font-semibold text-foreground">
										{tArtifact("previewNotSupported")}
									</p>
									<p className="text-xs text-muted-foreground/80 max-w-xs mx-auto leading-relaxed">
										{tArtifact("languageNotSupported", {
											language: getLanguageDisplayName(finalLanguage),
										})}
									</p>
								</motion.div>
							</div>
						</div>
					</motion.div>
				);
		}
	};

	// 渲染预览工具（针对不同类型的预览）
	const renderPreviewTools = () => {
		if (viewMode !== "preview" || !canPreview) return null;

		switch (previewType) {
			case "html":
				return (
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded-md border border-primary/20">
							<Globe className="w-4 h-4 text-primary" />
							<span className="text-sm font-medium text-foreground">
								{tArtifact("htmlPreview")}
							</span>
						</div>
						{/* HTML 响应式视图切换 */}
						<div className="flex items-center gap-1 p-1 bg-muted/50 rounded-md border">
							<Button
								variant={htmlViewMode === "desktop" ? "default" : "ghost"}
								size="sm"
								onClick={() => setHtmlViewMode("desktop")}
								className="h-6 w-6 p-0"
								title={tArtifact("desktopView")}
							>
								<Monitor className="w-3 h-3" />
							</Button>
							<Button
								variant={htmlViewMode === "tablet" ? "default" : "ghost"}
								size="sm"
								onClick={() => setHtmlViewMode("tablet")}
								className="h-6 w-6 p-0"
								title={tArtifact("tabletView")}
							>
								<Tablet className="w-3 h-3" />
							</Button>
							<Button
								variant={htmlViewMode === "mobile" ? "default" : "ghost"}
								size="sm"
								onClick={() => setHtmlViewMode("mobile")}
								className="h-6 w-6 p-0"
								title={tArtifact("mobileView")}
							>
								<Smartphone className="w-3 h-3" />
							</Button>
						</div>
					</div>
				);
			case "react":
				return (
					<div className="flex items-center gap-2 px-2 py-1 bg-cyan-50 dark:bg-cyan-900/20 rounded-md border border-cyan-200 dark:border-cyan-800">
						<Code2 className="w-4 h-4 text-cyan-600" />
						<span className="text-sm font-medium text-cyan-700 dark:text-cyan-400">
							{tArtifact("reactComponentPreview")}
						</span>
					</div>
				);
			case "python":
				return (
					<div className="flex items-center gap-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
						<Code2 className="w-4 h-4 text-blue-600" />
						<span className="text-sm font-medium text-blue-700 dark:text-blue-400">
							Python 执行器
						</span>
					</div>
				);
			case "javascript":
				return (
					<div className="flex items-center gap-2 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
						<Code2 className="w-4 h-4 text-yellow-600" />
						<span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
							JavaScript 执行器
						</span>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div className={cn("h-full flex flex-col", className)}>
			{/* 统一工具栏 */}
			<div className="flex items-center justify-between px-3 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 min-h-[36px]">
				{/* 左侧：语言标识和预览工具 */}
				<div className="flex items-center gap-2 min-w-0 flex-1">
					<div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md border border-border/50">
						<Code2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
						<span className="text-xs font-medium text-foreground">
							{getLanguageDisplayName(finalLanguage)}
						</span>
					</div>
					
					{/* 预览特定的工具 */}
					{renderPreviewTools()}
				</div>

				{/* 中间：视图切换 */}
				<div className="flex-shrink-0">
					<Tabs
						value={viewMode}
						onValueChange={(v) => setViewMode(v as typeof viewMode)}
					>
						<TabsList className="h-6 bg-muted/30">
							<TabsTrigger value="code" className="h-5 px-2.5 text-xs">
								<Code2 className="w-3 h-3 mr-1" />
								代码
							</TabsTrigger>
							<TabsTrigger
								value="preview"
								className="h-5 px-2.5 text-xs"
								disabled={!canPreview}
							>
								<Eye className="w-3 h-3 mr-1" />
								预览
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				{/* 右侧：工具按钮 */}
				<div className="flex items-center gap-1.5 flex-shrink-0">
					{/* 复制下载按钮组 */}
					<div className="flex items-center rounded-md overflow-hidden bg-muted/30 border border-border/50">
						<Button
							variant="ghost"
							size="icon"
							onClick={handleCopy}
							disabled={!content}
							className={cn(
								"h-7 w-7 rounded-none border-0",
								copyStatus === "copied"
									? "text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
									: "hover:bg-muted",
							)}
							title={copyStatus === "copied" ? tCommon("copied") : tCommon("copy")}
						>
							{copyStatus === "copied" ? (
								<Check className="h-3.5 w-3.5" />
							) : (
								<Copy className="h-3.5 w-3.5" />
							)}
						</Button>
						<div className="w-px h-4 bg-border/60" />
						<Button
							variant="ghost"
							size="icon"
							onClick={handleDownload}
							disabled={!content}
							className="h-7 w-7 rounded-none border-0 hover:bg-muted"
							title={tCommon("download")}
						>
							<Download className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>
			</div>

			{/* 内容区域 */}
			<div className="flex-1 overflow-hidden">
				<Tabs value={viewMode} className="h-full">
					<TabsContent value="code" className="h-full m-0">
						<motion.div
							className="h-full"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.3, ease: "easeInOut" }}
						>
							<CodeEditor
								value={content}
								language={finalLanguage}
								showHeader={false}
								showCopyButton={true}
								height="100%"
								className="h-full"
							/>
						</motion.div>
					</TabsContent>

					<TabsContent value="preview" className="h-full m-0">
						<motion.div
							className="h-full overflow-hidden"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.3, ease: "easeInOut" }}
						>
							{renderPreview()}
						</motion.div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
