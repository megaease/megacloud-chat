// components/artifact/ArtifactContentPanel.tsx
"use client";

import { useArtifact } from "@/context/artifact-provider-context";
import type { ArtifactKind } from "@/lib/artifact-types";
import { useTranslations } from "next-intl";
import { memo, useEffect, useMemo } from "react";
import { ArtifactActions } from "./ArtifactActions";
import { ArtifactContent } from "./ArtifactContent";

// 根据文档类型生成简洁的默认标题（不包含状态信息）
function getDefaultTitle(
	kind: ArtifactKind,
	t: ReturnType<typeof useTranslations>,
): string {
	const kindTitles = {
		text: t("documentType"),
		code: t("codeType"),
		sheet: t("sheetType"),
		image: t("imageType"),
		"react-app": t("documentType"),
	};

	const baseTitle = kindTitles[kind] || t("documentType");

	// 不再在标题中包含状态信息，状态由右边的指示器显示
	return t("newType", { type: baseTitle });
}

interface ArtifactContentPanelProps {
	onClose?: () => void;
	onChatToggle?: () => void;
	showChatButton?: boolean;
	isMobile?: boolean;
}

export const ArtifactContentPanel = memo(function ArtifactContentPanel({
	onClose,
	onChatToggle,
	showChatButton = false,
	isMobile = false,
}: ArtifactContentPanelProps) {
	const { artifact, hideArtifact, switchToVersion } = useArtifact();
	const tArtifact = useTranslations("Artifact");

	// 监听版本切换事件
	useEffect(() => {
		const handleVersionSwitch = (event: CustomEvent) => {
			const { documentId, version, title, kind } = event.detail;

			// 检查当前 artifact 是否匹配
			if (artifact.documentId === documentId) {
				// 构造版本对象并切换
				const versionObject = {
					id: documentId,
					version,
					title: title || artifact.title,
					kind: kind || artifact.kind,
					content: artifact.content, // 保持当前内容，实际会从 API 加载
					language: artifact.language,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};

				switchToVersion(versionObject);
			}
		};

		window.addEventListener(
			"artifact-version-switch",
			handleVersionSwitch as EventListener,
		);

		return () => {
			window.removeEventListener(
				"artifact-version-switch",
				handleVersionSwitch as EventListener,
			);
		};
	}, [artifact, switchToVersion]);

	// 默认关闭处理程序
	const handleClose = () => {
		hideArtifact();
		onClose?.();
	};

	// 优化：使用 useMemo 避免 ArtifactActions 因为 content 变化而重新渲染
	// ArtifactActions 只需要 title, status, kind，不需要 content
	const artifactActionsProps = useMemo(
		() => ({
			title: artifact.title || getDefaultTitle(artifact.kind, tArtifact),
			status: artifact.status,
			kind: artifact.kind,
		}),
		[artifact.title, artifact.status, artifact.kind, tArtifact],
	);

	return (
		<div className="h-full bg-background flex flex-col">
			{/* Artifact 头部工具栏 */}
			<ArtifactActions
				title={artifactActionsProps.title}
				status={artifactActionsProps.status}
				kind={artifactActionsProps.kind}
				onClose={handleClose}
				onChatToggle={onChatToggle}
				showChatButton={showChatButton}
				isMobile={isMobile}
			/>
			{/* Artifact 内容区域 */}
			<div className="flex-1 overflow-hidden relative">
				<ArtifactContent />
			</div>
		</div>
	);
});
