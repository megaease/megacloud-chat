"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useArtifact } from "@/context/artifact-provider-context";

interface ArtifactOpenerProps {
	artifactId: string | null;
}

export function ArtifactOpener({ artifactId }: ArtifactOpenerProps) {
	const { loadAndShowArtifact } = useArtifact();
	const router = useRouter();

	useEffect(() => {
		if (artifactId) {
			// 延迟一下，确保页面加载完成
			const timeout = setTimeout(async () => {
				try {
					await loadAndShowArtifact(artifactId);
					
					// 清除URL参数，避免刷新时重复打开
					if (typeof window !== 'undefined') {
						const url = new URL(window.location.href);
						url.searchParams.delete('openArtifact');
						router.replace(url.pathname + url.search, { scroll: false });
					}
				} catch (error) {
					console.error('Failed to open artifact:', error);
				}
			}, 100);

			return () => clearTimeout(timeout);
		}
	}, [artifactId, loadAndShowArtifact, router]);

	return null; // 这是一个纯功能组件，不渲染任何内容
}