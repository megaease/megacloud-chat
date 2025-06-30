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
	status?: "streaming" | "idle" | "error";
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
				<div className="p-6 md:px-20">
					<div className="prose prose-sm max-w-none dark:prose-invert prose-pre:bg-muted prose-pre:border prose-pre:rounded-md">
						{/* Force re-render by using key with content length */}
						<Markdown key={content.length} content={content} />
						{/* Add typing cursor when streaming */}
						{status === "streaming" && (
							<span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
						)}
						{status === "streaming" && (
							<div className="flex items-center gap-2 text-muted-foreground mt-4 pb-4">
								<Loader2 className="h-4 w-4 animate-spin" />
								<span className="text-sm">Generating content...</span>
							</div>
						)}
					</div>
				</div>
			);
		}

		return (
			<div className="p-4">
				<Card className="p-4 relative">
					<pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed">
						{content}
					</pre>
					{status === "streaming" && (
						<div className="flex items-center gap-2 text-muted-foreground mt-4 pt-4 border-t">
							<Loader2 className="h-4 w-4 animate-spin" />
							<span className="text-sm">Generating content...</span>
						</div>
					)}
				</Card>
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
