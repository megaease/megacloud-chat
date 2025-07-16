import { useCallback } from "react";
import { useArtifact } from "@/context/artifact-provider-context";
import type { ToolInvocationPart } from "@/types/tool-invocation";

/**
 * 专门处理文档工具交互的 Hook
 * 
 * 职责：
 * 1. 从工具结果中提取文档信息
 * 2. 提供统一的版本切换接口
 * 3. 避免直接修改 artifact context
 * 4. 确保数据流向清晰
 */
export function useDocumentToolAction() {
  const { loadAndShowArtifact } = useArtifact();

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
    
    return {
      documentId: (resultObj.documentId || resultObj.id) as string | undefined,
      title: resultObj.title as string | undefined,
      version: resultObj.version as number | undefined,
      kind: resultObj.kind as string | undefined,
    };
  }, []);

  /**
   * 处理文档工具的点击事件
   * 
   * 逻辑：
   * 1. 优先使用工具结果中的 documentId
   * 2. 如果有版本号，切换到指定版本
   * 3. 否则加载最新版本
   * 4. 统一通过 loadAndShowArtifact 管理状态
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
      boundingBox?: { top: number; left: number; width: number; height: number }
    ) => {
      // 从工具结果中提取信息
      const resultInfo = extractDocumentInfo(part);
      
      // 确定要使用的 documentId
      const documentId = resultInfo?.documentId || args?.documentId;
      
      if (!documentId) {
        console.warn("No documentId found in tool result or args");
        return;
      }

      // 计算默认位置
      const defaultBoundingBox = boundingBox || {
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 200,
        width: 400,
        height: 200,
      };

      // 如果有版本号，切换到指定版本
      if (resultInfo?.version !== undefined) {
        loadAndShowArtifact(documentId, defaultBoundingBox, resultInfo.version);
      } else {
        // 否则加载最新版本
        loadAndShowArtifact(documentId, defaultBoundingBox);
      }
    },
    [extractDocumentInfo, loadAndShowArtifact]
  );

  /**
   * 检查是否可以打开 artifact
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
      status?: string
    ) => {
      // 成功状态肯定可以打开
      if (status === "success") {
        return true;
      }

      // 执行中状态，如果有标题或者是更新操作也可以打开
      if (status === "executing") {
        return !!(args?.title || args?.documentId);
      }

      return false;
    },
    []
  );

  return {
    handleDocumentClick,
    canOpenArtifact,
    extractDocumentInfo,
  };
}