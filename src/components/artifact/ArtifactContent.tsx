// components/artifact/ArtifactContent.tsx
"use client";

import type { ArtifactKind } from "@/lib/artifact-types";
import { TextArtifact } from "./TextArtifact";
import { CodePreview } from "./CodePreview";

interface ArtifactContentProps {
	kind: ArtifactKind;
	content: string;
	status: "streaming" | "idle";
	title: string;
	viewMode?: "code" | "preview";
}

export function ArtifactContent({
	kind,
	content,
	status,
	title,
	viewMode = "code",
}: ArtifactContentProps) {
	switch (kind) {
		case "code":
			return (
				<div className="h-full">
					<CodePreview content={content} className="h-full" mode={viewMode} />
				</div>
			);

		case "text":
			return <TextArtifact content={content} title={title} status={status} />;

		case "sheet":
			return (
				<div className="h-full flex flex-col">
					<div className="flex-1 p-4">
						<pre className="whitespace-pre-wrap font-mono text-sm">
							{content}
						</pre>
					</div>
				</div>
			);

		default:
			return (
				<div className="h-full flex items-center justify-center">
					<div className="text-muted-foreground">
						Unsupported content type: {kind}
					</div>
				</div>
			);
	}
}
