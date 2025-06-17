// components/artifact/TextArtifact.tsx
"use client";

import { Markdown } from "@/components/markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, Eye, FileText } from "lucide-react";
import { useState } from "react";
import { CopyButton } from "../copy-button";

interface TextArtifactProps {
	content: string;
	title: string;
	status: "streaming" | "idle";
}

export function TextArtifact({ content, title, status }: TextArtifactProps) {
	const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");

	return (
		<div className="h-full flex flex-col">
			{/* Content area */}
			<div className="flex-1 overflow-auto">
				{viewMode === "rendered" ? (
					<div className="p-6 md:px-20">
						<div className="prose prose-sm max-w-none dark:prose-invert prose-pre:bg-muted prose-pre:border prose-pre:rounded-md">
							<Markdown content={content} />
						</div>
					</div>
				) : (
					<div className="p-4">
						<Card className="p-4">
							<pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed">
								{content}
							</pre>
						</Card>
					</div>
				)}
			</div>
		</div>
	);
}
