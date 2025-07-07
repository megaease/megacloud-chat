// context/artifact-provider-context.tsx
"use client";

import {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
	UIArtifact,
	ArtifactKind,
	ArtifactLanguage,
} from "@/lib/artifact-types";
import type { ArtifactVersion } from "@/hooks/use-artifact-versions";

interface ArtifactContextType {
	// 当前 artifact 状态
	artifact: UIArtifact;
	setArtifact: (
		artifact: UIArtifact | ((prev: UIArtifact) => UIArtifact),
	) => void;

	// 版本管理 - 保留，因为其他组件需要切换版本
	switchToVersion: (version: ArtifactVersion) => void;
	loadAndShowArtifact: (
		documentId: string,
		boundingBox?: { top: number; left: number; width: number; height: number },
		versionNumber?: number,
	) => Promise<void>;

	// 显示控制 - 保留，因为多个组件需要控制显示状态
	showArtifact: (boundingBox?: {
		top: number;
		left: number;
		width: number;
		height: number;
	}) => void;
	hideArtifact: () => void;

	// 重置 - 保留，因为是全局状态清理
	reset: () => void;
}

const ArtifactContext = createContext<ArtifactContextType | null>(null);

// 默认的 artifact 状态
const defaultArtifact: UIArtifact = {
	documentId: "",
	title: "",
	kind: "text",
	content: "",
	isVisible: false,
	status: "idle",
	boundingBox: { top: 0, left: 0, width: 0, height: 0 },
};

export function ArtifactProvider({ children }: { children: ReactNode }) {
	const [artifact, setArtifactInternal] = useState<UIArtifact>(defaultArtifact);
	const queryClient = useQueryClient();

	// 包装 setArtifact 以添加调试信息
	const setArtifact = useCallback((
		artifact: UIArtifact | ((prev: UIArtifact) => UIArtifact),
	) => {
		setArtifactInternal((prev) => {
			const newArtifact = typeof artifact === 'function' ? artifact(prev) : artifact;
			return newArtifact;
		});
	}, []);

	// 获取版本数据的辅助函数，使用 React Query 的缓存
	const getVersionsFromCache = useCallback(
		async (documentId: string, forceRefresh = false): Promise<ArtifactVersion[]> => {
			try {
				// 如果需要强制刷新，先清除缓存
				if (forceRefresh) {
					await queryClient.invalidateQueries({
						queryKey: ["artifact-versions", documentId],
					});
				}

				// 尝试从缓存获取，如果没有则发起请求
				const versions = await queryClient.fetchQuery({
					queryKey: ["artifact-versions", documentId],
					queryFn: async () => {
						const url = new URL(
							`/api/artifacts/${documentId}`,
							window.location.origin,
						);
						url.searchParams.set("versions", "true");
						url.searchParams.set("userId", "user-id");

						const response = await fetch(url.toString());
						if (!response.ok) {
							throw new Error(`Failed to fetch versions: ${response.status}`);
						}
						const data = await response.json();
						return data.versions || [];
					},
					staleTime: 5 * 60 * 1000, // 5 minutes
					gcTime: 10 * 60 * 1000, // 10 minutes
				});

				return versions;
			} catch (error) {
				console.error("❌ Failed to load versions:", error);
				return [];
			}
		},
		[queryClient],
	);

	// 加载版本并显示指定版本（可选）
	const loadAndShowArtifact = useCallback(
		async (
			documentId: string,
			boundingBox?: {
				top: number;
				left: number;
				width: number;
				height: number;
			},
			versionNumber?: number,
		) => {
			try {
				// 优化：只有在没有现有内容时才显示加载状态，避免闪烁
				setArtifact((prev) => {
					const hasExistingContent = prev.content && prev.content.trim() !== "";
					return {
						...prev,
						isVisible: true,
						boundingBox: boundingBox || prev.boundingBox,
						// 只有在没有现有内容时才设置 loading 状态
						status: hasExistingContent ? prev.status : "loading",
					};
				});

				// 加载版本数据，如果没有指定版本则强制刷新获取最新数据
				const forceRefresh = versionNumber === undefined;
				const versions = await getVersionsFromCache(documentId, forceRefresh);

				let targetVersion = versions[0]; // 默认使用最新版本

				// 如果指定了版本号，尝试找到对应版本
				if (versionNumber !== undefined) {
					const foundVersion = versions.find(
						(v: ArtifactVersion) => v.version === versionNumber,
					);
					if (foundVersion) {
						targetVersion = foundVersion;
					}
				}

				if (targetVersion) {
					setArtifact((prev) => ({
						...prev,
						documentId: targetVersion.id, // targetVersion.id 就是正确的 documentId
						title: targetVersion.title,
						kind: targetVersion.kind,
						content: targetVersion.content,
						language: targetVersion.language,
						status: "idle",
						isVisible: true,
						boundingBox: boundingBox || prev.boundingBox,
					}));
				} else {
					throw new Error("No versions found");
				}
			} catch (error) {
				console.error("Failed to load artifact:", error);
				setArtifact((prev) => ({
					...prev,
					title: "Error Loading",
					content: `Failed to load content: ${error instanceof Error ? error.message : "Unknown error"}`,
					status: "error",
				}));
			}
		},
		[getVersionsFromCache],
	);

	// 切换到指定版本
	const switchToVersion = useCallback((version: ArtifactVersion) => {
		setArtifact((prev) => ({
			...prev,
			// 不改变 documentId，因为所有版本都属于同一个文档
			title: version.title,
			kind: version.kind,
			content: version.content,
			language: version.language,
			status: "idle",
		}));
	}, []);

	// 显示 artifact
	const showArtifact = useCallback(
		(boundingBox?: {
			top: number;
			left: number;
			width: number;
			height: number;
		}) => {
			setArtifact((prev) => ({
				...prev,
				isVisible: true,
				boundingBox: boundingBox || prev.boundingBox,
			}));
		},
		[],
	);

	// 隐藏 artifact
	const hideArtifact = useCallback(() => {
		setArtifact((prev) => ({
			...prev,
			isVisible: false,
		}));
	}, []);

	// 重置 artifact
	const reset = useCallback(() => {
		setArtifact(defaultArtifact);
	}, []);

	const value: ArtifactContextType = {
		artifact,
		setArtifact,
		loadAndShowArtifact,
		switchToVersion,
		showArtifact,
		hideArtifact,
		reset,
	};

	return (
		<ArtifactContext.Provider value={value}>
			{children}
		</ArtifactContext.Provider>
	);
}

export function useArtifact() {
	const context = useContext(ArtifactContext);
	if (!context) {
		throw new Error("useArtifact must be used within an ArtifactProvider");
	}
	return context;
}
