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

	// 严格的数据源判断逻辑：
	// - streaming/loading 状态：使用 artifact 流式内容
	// - success 状态：使用数据库最新版本
	const isStreamingOrLoading = status === "streaming";
	const shouldUseStreamingContent = isStreamingOrLoading;

	// Fetch all versions when documentId is provided
	// 只有在非 streaming 状态下才启用数据库查询
	const {
		data: versions,
		isLoading: versionsLoading,
		error: versionsError,
	} = useQuery({
		queryKey: ["artifact-versions", documentId],
		queryFn: () => fetchArtifactVersions(documentId as string),
		enabled: !!documentId && !isStreamingOrLoading, // 只有在非 streaming 状态下才查询
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

	// 版本切换不应该修改全局 artifact 状态
	// 版本数据仅用于在当前组件中展示选中的版本内容

	// 数据优先级逻辑：
	// 1. 如果是 streaming/loading 状态：使用传入的 artifact props（流式内容）
	// 2. 如果是 success 状态：使用数据库版本内容（选中版本或最新版本）
	const displayData = shouldUseStreamingContent
		? {
				kind: kind || "text",
				content: content || "",
				title: title || "Untitled",
				language: language, // 使用流式 props 中的 language
			}
		: currentVersionData
			? {
					kind: currentVersionData.kind,
					content: currentVersionData.content,
					title: currentVersionData.title,
					language: currentVersionData.language, // 使用版本数据中的 language
				}
			: {
					// 后备方案：使用传入的 props
					kind: kind || "text",
					content: content || "",
					title: title || "Untitled",
					language: language,
				};

	const displayStatus = status || "idle";

	// Loading state - 只有在查询版本数据时才显示加载状态
	if (versionsLoading && !shouldUseStreamingContent) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-muted-foreground">Loading artifact...</div>
			</div>
		);
	}

	// Error state - 只有在查询版本数据失败时才显示错误状态
	if (versionsError && !shouldUseStreamingContent) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-destructive">Error: {versionsError.message}</div>
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
