// components/artifact/TextArtifact.tsx
"use client";

import { Markdown } from "@/components/markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, Eye, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { CopyButton } from "../copy-button";

interface TextArtifactProps {
	content: string;
	title: string;
	status?: "streaming" | "idle" | "error" | "submitted";
}

export function TextArtifact({
	content,
	title,
	status = "idle",
}: TextArtifactProps) {
	const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");

	const renderContent = () => {
		if (viewMode === "rendered") {
			return (
				<div className="h-full">
					<div className="p-6 md:px-12 lg:px-20 max-w-4xl mx-auto">
						<div className="prose prose-sm max-w-none dark:prose-invert prose-pre:bg-muted prose-pre:border prose-pre:rounded-md prose-headings:scroll-m-20 prose-h1:text-2xl prose-h1:font-bold prose-h2:text-xl prose-h2:font-semibold prose-h3:text-lg prose-h3:font-medium prose-p:leading-7 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:italic prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-ul:my-6 prose-ol:my-6 prose-li:my-2">
							{/* Force re-render by using key with content length */}
							<Markdown key={content.length} content={content} />
							{/* Add typing cursor when streaming */}
							{status === "streaming" && (
								<span className="inline-block w-0.5 h-5 bg-primary animate-pulse ml-1 rounded-sm" />
							)}
						</div>
						{status === "streaming" && (
							<div className="flex items-center gap-3 text-muted-foreground mt-8 p-4 bg-muted/30 rounded-lg border border-border/50">
								<Loader2 className="h-4 w-4 animate-spin text-primary" />
								<span className="text-sm font-medium">
									Generating content...
								</span>
							</div>
						)}
					</div>
				</div>
			);
		}

		return (
			<div className="h-full">
				<div className="p-6 md:px-12 lg:px-20 max-w-4xl mx-auto">
					<Card className="p-6 relative bg-card/50 backdrop-blur-sm border shadow-sm">
						<pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed overflow-auto max-h-[calc(100vh-12rem)]">
							{content}
						</pre>
						{status === "streaming" && (
							<div className="flex items-center gap-3 text-muted-foreground mt-6 pt-4 border-t border-border-/50">
								<Loader2 className="h-4 w-4 animate-spin text-primary" />
								<span className="text-sm font-medium">
									Generating content...
								</span>
							</div>
						)}
					</Card>
				</div>
			</div>
		);
	};

	return (
		<div className="h-full flex flex-col">
			{/* Content area */}
			<div className="flex-1 overflow-auto">{renderContent()}</div>
		</div>
	);
}
