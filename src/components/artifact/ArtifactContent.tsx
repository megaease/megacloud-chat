// components/artifact/ArtifactContent.tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
	// Version control props
	onVersionsLoaded?: (versions: ArtifactVersion[]) => void;
	selectedVersion?: number;
}

interface ArtifactData {
	id: string;
	title: string;
	kind: ArtifactKind;
	content: string;
	version?: number;
}

interface ArtifactVersion {
	id: string;
	version: number;
	title: string;
	content: string;
	kind: ArtifactKind;
	updatedAt: string;
}

// Fetch all artifact versions (includes complete data for all versions)
const fetchArtifactVersions = async (
	documentId: string,
): Promise<ArtifactVersion[]> => {
	const apiUrl = `/api/artifacts/${documentId}?versions=true&userId=user-id`;
	const response = await fetch(apiUrl);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`Failed to fetch artifact versions: ${response.status} - ${errorText}`,
		);
	}

	const responseData = await response.json();
	const versions = responseData.versions || [];

	return versions;
};

export function ArtifactContent({
	// Streaming mode props
	kind,
	content,
	status,
	title,
	viewMode = "code",
	// Database mode props
	documentId,
	// Version control props
	onVersionsLoaded,
	selectedVersion,
}: ArtifactContentProps) {
	const { setArtifact } = useArtifact();
	const [currentVersionData, setCurrentVersionData] =
		useState<ArtifactVersion | null>(null);

	// Fetch all versions when documentId is provided
	const {
		data: versions,
		isLoading: loading,
		error,
	} = useQuery({
		queryKey: ["artifact-versions", documentId],
		queryFn: () => fetchArtifactVersions(documentId as string),
		enabled: !!documentId,
		staleTime: 1000 * 60 * 5,
		gcTime: 1000 * 60 * 10,
		retry: 3,
	});

	// Notify parent component when versions are loaded
	useEffect(() => {
		if (versions && onVersionsLoaded) {
			onVersionsLoaded(versions);
		}
	}, [versions, onVersionsLoaded]);

	// Update current version data when selectedVersion changes
	useEffect(() => {
		if (versions && selectedVersion) {
			const versionData = versions.find((v) => v.version === selectedVersion);
			setCurrentVersionData(versionData || null);
		} else if (versions && versions.length > 0 && versions[0]) {
			// Default to latest version (first in array since it's ordered by desc)
			setCurrentVersionData(versions[0]);
		}
	}, [versions, selectedVersion]);

	// Update global artifact state when current version changes
	useEffect(() => {
		if (currentVersionData) {
			setArtifact((prev) => {
				// 如果正在流式生成，不要用版本数据覆盖
				if (prev.isStreaming && prev.dataSource === "stream") {
					console.log("Skipping version update during streaming");
					return prev;
				}

				return {
					...prev,
					title: currentVersionData.title,
					content: currentVersionData.content,
					kind: currentVersionData.kind,
					dataSource: "version",
					isStreaming: false,
				};
			});
		}
	}, [currentVersionData, setArtifact]);

	// Determine which data to use - prioritize streaming content over database content
	const isStreaming = status === "streaming";
	const displayData = isStreaming
		? {
				kind: kind || "text",
				content: content || "",
				title: title || "Untitled",
			}
		: currentVersionData || {
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
				<div className="text-destructive">Error: {error.message}</div>
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
