import { useCallback } from "react";
import { useArtifact } from "@/context/artifact-provider-context";
import type { ToolInvocationPart } from "@/types/tool-invocation";

/**
 * 专门处理文档工具交互的 Hook
 *
 * 职责：
 * 1. 从工具结果中提取文档信息
 * 2. 提供统一的版本切换接口
 * 3. 防止 streaming 时的数据冲突
 * 4. 确保数据流向清晰
 */
export function useDocumentToolAction() {
	const { loadAndShowArtifact, showArtifact, artifact } = useArtifact();

	/**
	 * 从工具调用结果中提取文档信息
	 */
	const extractDocumentInfo = useCallback((part?: ToolInvocationPart) => {
		if (!part?.toolInvocation?.result) {
			return null;
		}

		const result = part.toolInvocation.result;

		if (typeof result !== "object") {
			return null;
		}

		const resultObj = result as Record<string, unknown>;
		const info = {
			documentId: (resultObj.documentId || resultObj.id) as string | undefined,
			title: resultObj.title as string | undefined,
			version: resultObj.version as number | undefined,
			kind: resultObj.kind as string | undefined,
		};
		if (process.env.NODE_ENV !== "production") {
			// eslint-disable-next-line no-console
			console.debug("[Artifact] extractDocumentInfo", info);
		}
		return info;
	}, []);

	/**
	 * 处理文档工具的点击事件
	 *
	 * 逻辑：
	 * 1. 优先使用工具结果中的 documentId
	 * 2. 如果有 documentId，加载对应的 artifact
	 * 3. 如果没有 documentId 但有 kind，只显示当前 artifact（避免覆盖 streaming 数据）
	 * 4. 如果有版本号，切换到指定版本
	 * 5. 统一通过 artifact provider 管理状态
	 */
	const handleDocumentClick = useCallback(
		(
			part?: ToolInvocationPart,
			args?: {
				title?: string;
				content?: string;
				kind?: string;
				documentId?: string;
			},
			boundingBox?: {
				top: number;
				left: number;
				width: number;
				height: number;
			},
		) => {
			// 从工具结果中提取信息
			const resultInfo = extractDocumentInfo(part);

			// 确定要使用的 documentId
			const documentId = resultInfo?.documentId || args?.documentId;
			const kind = resultInfo?.kind || args?.kind;

			if (!documentId && !kind) {
				console.warn("No documentId or kind found in tool result or args");
				return;
			}

			// 计算默认位置
			const defaultBoundingBox = boundingBox || {
				top: window.innerHeight / 2 - 100,
				left: window.innerWidth / 2 - 200,
				width: 400,
				height: 200,
			};

			// 如果有 documentId，使用 documentId 加载
			if (documentId) {
				// 如果有版本号，切换到指定版本
				if (resultInfo?.version !== undefined) {
					if (process.env.NODE_ENV !== "production") {
						// eslint-disable-next-line no-console
						console.debug("[Artifact] loadAndShowArtifact (with version)", {
							documentId,
							version: resultInfo.version,
						});
					}
					loadAndShowArtifact(
						documentId,
						defaultBoundingBox,
						resultInfo.version,
					);
				} else {
					// 否则加载最新版本
					if (process.env.NODE_ENV !== "production") {
						// eslint-disable-next-line no-console
						console.debug("[Artifact] loadAndShowArtifact (latest)", {
							documentId,
						});
					}
					loadAndShowArtifact(documentId, defaultBoundingBox);
				}
			} else if (kind) {
				// 如果只有 kind，不加载新的 artifact，只显示当前的 artifact
				// 这样避免覆盖正在 streaming 的数据
				if (process.env.NODE_ENV !== "production") {
					// eslint-disable-next-line no-console
					console.debug("[Artifact] showArtifact (kind only)", { kind });
				}
				showArtifact(defaultBoundingBox);
			}
		},
		[extractDocumentInfo, loadAndShowArtifact, showArtifact],
	);

	/**
	 * 检查是否可以打开 artifact
	 *
	 * 新增：考虑 streaming 状态的影响
	 * 支持通过 kind 也能打开 artifact
	 */
	const canOpenArtifact = useCallback(
		(
			part?: ToolInvocationPart,
			args?: {
				title?: string;
				content?: string;
				kind?: string;
				documentId?: string;
			},
			status?: string,
		) => {
			// 成功状态肯定可以打开
			if (status === "success") {
				return true;
			}

			// 执行中状态，如果有标题、documentId 或者 kind 都可以打开
			if (status === "executing") {
				return !!(args?.title || args?.documentId || args?.kind);
			}

			return false;
		},
		[],
	);

	/**
	 * 检查当前是否正在 streaming
	 * 如果是，则不应该切换版本
	 */
	const isStreamingActive = useCallback(() => {
		return artifact.status === "streaming";
	}, [artifact.status]);

	/**
	 * 检查是否应该禁用版本切换
	 */
	const shouldDisableVersionSwitch = useCallback(
		(
			part?: ToolInvocationPart,
			args?: {
				title?: string;
				content?: string;
				kind?: string;
				documentId?: string;
			},
		) => {
			// 如果当前正在 streaming，且点击的不是当前 streaming 的文档
			if (isStreamingActive()) {
				const resultInfo = extractDocumentInfo(part);
				const documentId = resultInfo?.documentId || args?.documentId;
				const kind = resultInfo?.kind || args?.kind;

				// 如果点击的是不同的文档，则禁用
				// 优先比较 documentId，如果没有则比较 kind
				if (documentId) {
					return documentId !== artifact.documentId;
				}

				if (kind) {
					// 如果只有 kind，可能是新文档，允许切换
					return false;
				}

				return true;
			}

			return false;
		},
		[isStreamingActive, extractDocumentInfo, artifact.documentId],
	);

	return {
		handleDocumentClick,
		canOpenArtifact,
		extractDocumentInfo,
		isStreamingActive,
		shouldDisableVersionSwitch,
	};
}
