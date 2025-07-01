// components/artifact/ArtifactContent.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import type { ArtifactKind, ArtifactLanguage } from "@/lib/artifact-types";
import { TextArtifact } from "./TextArtifact";
import { CodePreview } from "./CodePreview";
import { useArtifact } from "@/context/artifact-provider-context";

interface ArtifactContentProps {
	// For streaming mode (used by DataStreamHandler)
	kind?: ArtifactKind;
	content?: string;
	status?: "streaming" | "idle" | "error" | "submitted";
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
	// - strbg-white dark:bg-gray-900 border-2 border-border-/30 shadow-lg rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl
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

	// 数据优先级逻辑：避免在状态切换时出现闪烁
	// 1. 如果是 streaming/loading 状态：使用传入的 artifact props（流式内容）
	// 2. 如果是 success 状态：使用数据库版本内容（选中版本或最新版本）
	// 3. 过渡期间：继续使用现有内容避免闪烁
	const displayData = useMemo(() => {
		if (shouldUseStreamingContent) {
			return {
				kind: kind || "text",
				content: content || "",
				title: title || "Untitled",
				language: language,
			};
		}

		if (currentVersionData) {
			return {
				kind: currentVersionData.kind,
				content: currentVersionData.content,
				title: currentVersionData.title,
				language: currentVersionData.language,
			};
		}

		// 后备方案：如果版本数据还在加载中，继续使用现有数据避免闪烁
		return {
			kind: kind || "text",
			content: content || "",
			title: title || "Untitled",
			language: language,
		};
	}, [
		shouldUseStreamingContent,
		currentVersionData,
		kind,
		content,
		title,
		language,
	]);

	const displayStatus = status || "idle";

	// 只有在没有任何内容可显示时才显示加载状态
	if (
		versionsLoading &&
		!shouldUseStreamingContent &&
		!content &&
		!currentVersionData
	) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-muted-foreground">Loading artifact...</div>
			</div>
		);
	}

	// 只有在确实发生错误且没有后备内容时才显示错误状态
	if (
		versionsError &&
		!shouldUseStreamingContent &&
		!content &&
		!currentVersionData
	) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-destructive">Error: {versionsError.message}</div>
			</div>
		);
	}

	// 创建一个唯一的 key 来触发动画，当内容真正变化时
	const contentKey = `${displayData.kind}-${displayStatus}-${displayData.content?.slice(0, 50)}`;

	// Render content based on kind
	const renderContent = () => {
		// 如果是 streaming 状态但没有内容，显示一个简单的准备状态
		if (
			shouldUseStreamingContent &&
			(!displayData.content || displayData.content.trim() === "")
		) {
			return (
				<div className="h-full flex items-center justify-center bg-gradient-to-br from-muted/5 to-muted/15">
					<div className="text-center space-y-4 p-8">
						<div className="relative">
							<div className="w-12 h-12 mx-auto bg-muted/10 rounded-lg flex items-center justify-center">
								<span className="text-2xl">⚡</span>
							</div>
						</div>
						<div className="space-y-2">
							<p className="text-sm font-medium text-foreground/80">
								Content is being generated...
							</p>
							<p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
								Please wait while we create your content
							</p>
						</div>
					</div>
				</div>
			);
		}

		switch (displayData.kind) {
			case "code":
				return (
					<CodePreview
						content={displayData.content}
						language={displayData.language}
						className="h-full"
						mode={viewMode}
					/>
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
					<div className="h-full flex flex-col bg-background">
						<div className="flex-1 p-6 md:px-12 lg:px-20 overflow-auto">
							<div className="max-w-4xl mx-auto">
								<div className="bg-card/50 backdrop-blur-sm border rounded-lg shadow-sm p-6">
									<pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
										{displayData.content}
									</pre>
								</div>
							</div>
						</div>
					</div>
				);

			default:
				return (
					<div className="h-full flex items-center justify-center bg-gradient-to-br from-muted/10 to-muted/30">
						<div className="text-center space-y-4 p-8">
							<div className="relative">
								<div className="w-16 h-16 mx-auto bg-muted/20 rounded-lg flex items-center justify-center">
									<span className="text-2xl">📄</span>
								</div>
								<div className="absolute inset-0 w-16 h-16 mx-auto border-2 border-dashed border-muted-foreground/20 rounded-lg" />
							</div>
							<div className="space-y-2">
								<p className="text-sm font-medium text-foreground">
									Unsupported Content Type
								</p>
								<p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
									The content type "{displayData.kind}" is not currently
									supported
								</p>
							</div>
						</div>
					</div>
				);
		}
	};

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={contentKey}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.15, ease: "easeInOut" }}
				className="h-full"
			>
				{renderContent()}
			</motion.div>
		</AnimatePresence>
	);
}
