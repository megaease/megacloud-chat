"use client";

import { useTranslations } from "next-intl";
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
					<div className="flex items-center justify-center h-full text-muted-foreground bg-gradient-to-br from-muted/10 to-muted/30">
						<div className="text-center space-y-4 p-8">
							<div className="relative">
								<Code2 className="w-16 h-16 mx-auto opacity-20" />
								<div className="absolute inset-0 w-16 h-16 mx-auto border-2 border-dashed border-muted-foreground/20 rounded-lg" />
							</div>
							<div className="space-y-2">
								<p className="text-sm font-medium text-foreground">
									{tArtifact("previewNotSupported")}
								</p>
								<p className="text-xs text-muted-foreground/70 max-w-xs mx-auto leading-relaxed">
									{tArtifact("languageNotSupported", {
										language: getLanguageDisplayName(finalLanguage),
									})}
								</p>
							</div>
						</div>
					</div>
				);
		}
	};

	return (
		<div className={cn("h-full", className)}>
			{mode === "code" ? (
				<div className="h-full">
					<CodeEditor
						value={content}
						language={finalLanguage}
						showHeader={false}
						showCopyButton={false}
						height="100%"
						className="h-full"
					/>
				</div>
			) : (
				<div className="h-full overflow-hidden">{renderPreview()}</div>
			)}
		</div>
	);
}
