// components/artifact/ArtifactContent.tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ArtifactKind, ArtifactLanguage } from "@/lib/artifact-types";
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
	language?: ArtifactLanguage; // Add language for streaming mode

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
	language?: ArtifactLanguage;
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
	language,
	// Database mode props
	documentId,
	// Version control props
	onVersionsLoaded,
	selectedVersion,
}: ArtifactContentProps) {
	const { setArtifact } = useArtifact();
	const [currentVersionData, setCurrentVersionData] =
		useState<ArtifactVersion | null>(null);

	// Determine which data to use - prioritize streaming content over database content
	const isStreaming = status === "streaming";
	const hasStreamingContent = isStreaming && (content || title);

	// Fetch all versions when documentId is provided
	// Only disable during active streaming to avoid conflicts
	const {
		data: versions,
		isLoading: loading,
		error,
	} = useQuery({
		queryKey: ["artifact-versions", documentId],
		queryFn: () => fetchArtifactVersions(documentId as string),
		enabled: !!documentId && status !== "streaming", // Only disable during active streaming
		staleTime: 1000 * 60 * 5,
		gcTime: 1000 * 60 * 10,
		retry: 3,
	});

	// Notify parent component when versions are loaded
	useEffect(() => {
		if (versions && onVersionsLoaded) {
			console.log("ArtifactContent: Versions loaded/updated", {
				count: versions.length,
				latestVersion: versions[0]?.version,
				documentId,
			});
			onVersionsLoaded(versions);
		}
	}, [versions, onVersionsLoaded, documentId]);

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

	// 版本切换不应该修改全局 artifact 状态
	// 版本数据仅用于在当前组件中展示选中的版本内容

	console.log("ArtifactContent render:", {
		status,
		isStreaming,
		hasStreamingContent,
		content: content?.substring(0, 50),
		title,
		currentVersionData: currentVersionData?.title,
		selectedVersion,
	});

	// 数据优先级：
	// 1. 流式内容（正在更新时）
	// 2. 选中的版本数据（用户切换版本时）
	// 3. 传入的 props 数据（后备方案）
	const displayData = hasStreamingContent
		? {
				kind: kind || "text",
				content: content || "",
				title: title || "Untitled",
				language: language, // Use language from streaming props
			}
		: currentVersionData || {
				kind: kind || "text",
				content: content || "",
				title: title || "Untitled",
				language: language,
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
						language={displayData.language}
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
