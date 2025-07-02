"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { CodeEditor } from "@/components/code-editor";
import { Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	getLanguage,
	getPreviewType,
	getLanguageDisplayName,
	isPreviewSupported,
} from "./utils/language-detector";
import { HtmlPreview, ReactPreview, JavaScriptPreview } from "./previews";
import type { ArtifactLanguage } from "@/lib/artifact-types";

interface CodePreviewProps {
	content: string;
	language?: ArtifactLanguage;
	className?: string;
	mode?: "code" | "preview";
}

export function CodePreview({
	content,
	language,
	className,
	mode = "code",
}: CodePreviewProps) {
	const tArtifact = useTranslations("Artifact");
	const finalLanguage = getLanguage(language, content);
	const previewType = getPreviewType(finalLanguage);

	const renderPreview = () => {
		switch (previewType) {
			case "html":
				return <HtmlPreview content={content} />;
			case "react":
				return <ReactPreview content={content} />;
			case "javascript":
				return <JavaScriptPreview content={content} />;
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

	return (
		<div className={cn("h-full", className)}>
			{mode === "code" ? (
				<motion.div 
					className="h-full"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3, ease: "easeInOut" }}
				>
					<motion.div
						initial={{ scale: 0.98 }}
						animate={{ scale: 1 }}
						transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
						className="h-full"
					>
						<CodeEditor
							value={content}
							language={finalLanguage}
							showHeader={false}
							showCopyButton={false}
							height="100%"
							className="h-full"
						/>
					</motion.div>
				</motion.div>
			) : (
				<motion.div 
					className="h-full overflow-hidden"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3, ease: "easeInOut" }}
				>
					<motion.div
						initial={{ scale: 0.98 }}
						animate={{ scale: 1 }}
						transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
						className="h-full"
					>
						{renderPreview()}
					</motion.div>
				</motion.div>
			)}
		</div>
	);
}
