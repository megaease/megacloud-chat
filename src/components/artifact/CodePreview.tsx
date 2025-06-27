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
					<div className="flex items-center justify-center h-full text-muted-foreground">
						<div className="text-center space-y-3">
							<Code2 className="w-12 h-12 mx-auto opacity-30" />
							<div>
								<p className="text-sm font-medium">
									{tArtifact("previewNotSupported")}
								</p>
								<p className="text-xs text-muted-foreground/60">
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
