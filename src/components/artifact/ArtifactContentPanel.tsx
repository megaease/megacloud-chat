// components/artifact/ArtifactContentPanel.tsx
"use client";

import { useArtifact } from "@/context/artifact-provider-context";
import type { ArtifactKind } from "@/lib/artifact-types";
import { useTranslations } from "next-intl";
import { memo, useMemo } from "react";
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
	const { artifact, hideArtifact } = useArtifact();
	const tArtifact = useTranslations("Artifact");

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
