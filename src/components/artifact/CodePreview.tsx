"use client";

import { CodeEditor } from "@/components/code-editor";
import { Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { detectLanguage } from "./utils/language-detector";
import { HtmlPreview, ReactPreview, JavaScriptPreview } from "./previews";

interface CodePreviewProps {
	content: string;
	language?: string;
	className?: string;
	mode?: "code" | "preview";
}

export function CodePreview({
	content,
	language,
	className,
	mode = "code",
}: CodePreviewProps) {
	const detectedLanguage = language || detectLanguage(content);

	const renderPreview = () => {
		switch (detectedLanguage.toLowerCase()) {
			case "html":
				return <HtmlPreview content={content} />;
			case "react":
			case "jsx":
			case "tsx":
				return <ReactPreview content={content} />;
			case "javascript":
			case "js":
				return <JavaScriptPreview content={content} />;
			default:
				return (
					<div className="flex items-center justify-center h-full text-muted-foreground">
						<div className="text-center space-y-3">
							<Code2 className="w-12 h-12 mx-auto opacity-30" />
							<div>
								<p className="text-sm font-medium">暂不支持预览</p>
								<p className="text-xs text-muted-foreground/60">
									{detectedLanguage.toUpperCase()} 语言暂时不支持可视化预览
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
						language={detectedLanguage}
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
