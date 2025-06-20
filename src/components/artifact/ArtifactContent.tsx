// components/artifact/ArtifactContent.tsx
"use client";

import { useEffect, useState } from "react";
import type { ArtifactKind } from "@/lib/artifact-types";
import { TextArtifact } from "./TextArtifact";
import { CodePreview } from "./CodePreview";
import { useArtifact } from "@/context/artifact-provider-context";

interface ArtifactContentProps {
	// For streaming mode (used by DataStreamHandler)
	kind?: ArtifactKind;
	content?: string;
	status?: "streaming" | "idle" | "error";
	title?: string;
	viewMode?: "code" | "preview";

	// For database mode (used when opening from ToolInvocationPart)
	documentId?: string;
}

interface ArtifactData {
	id: string;
	title: string;
	kind: ArtifactKind;
	content: string;
}

export function ArtifactContent({
	// Streaming mode props
	kind,
	content,
	status,
	title,
	viewMode = "code",
	// Database mode props
	documentId,
}: ArtifactContentProps) {
	const { setArtifact } = useArtifact();
	const [artifactData, setArtifactData] = useState<ArtifactData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Fetch artifact data when documentId is provided
	useEffect(() => {
		if (!documentId) return;

		const fetchArtifact = async () => {
			setLoading(true);
			setError(null);

			console.log("Fetching artifact with documentId:", documentId);

			try {
				const apiUrl = `/api/artifacts/${documentId}`; // 移除 userId 参数
				console.log("API URL:", apiUrl);

				const response = await fetch(apiUrl);
				console.log("Response status:", response.status);

				if (!response.ok) {
					const errorText = await response.text();
					console.error("API Error Response:", errorText);
					throw new Error(
						`Failed to fetch artifact: ${response.status} - ${errorText}`,
					);
				}

				const responseData = await response.json();
				console.log("API Response Data:", responseData);

				if (!responseData.artifact) {
					throw new Error("No artifact data in response");
				}

				const fetchedArtifact = responseData.artifact;
				setArtifactData(fetchedArtifact);

				// Update global artifact state with the fetched data
				setArtifact((prev) => ({
					...prev,
					title: fetchedArtifact.title,
					content: fetchedArtifact.content,
					kind: fetchedArtifact.kind,
				}));
			} catch (err) {
				console.error("Error fetching artifact:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load artifact",
				);
			} finally {
				setLoading(false);
			}
		};

		fetchArtifact();
	}, [documentId, setArtifact]);

	// Determine which data to use
	const displayData = artifactData || {
		kind: kind || "text",
		content: content || "",
		title: title || "Untitled",
	};

	const displayStatus = status || "idle";

	// Loading state
	if (loading) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-muted-foreground">Loading artifact...</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-destructive">Error: {error}</div>
			</div>
		);
	}

	// Render content based on kind
	switch (displayData.kind) {
		case "code":
			return (
				<div className="h-full">
					<CodePreview
						content={displayData.content}
						className="h-full"
						mode={viewMode}
					/>
				</div>
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
				<div className="h-full flex flex-col">
					<div className="flex-1 p-4">
						<pre className="whitespace-pre-wrap font-mono text-sm">
							{displayData.content}
						</pre>
					</div>
				</div>
			);

		default:
			return (
				<div className="h-full flex items-center justify-center">
					<div className="text-muted-foreground">
						Unsupported content type: {displayData.kind}
					</div>
				</div>
			);
	}
}
