"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Tablet, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { PreviewToolbar } from "../PreviewToolbar";

interface HtmlPreviewProps {
  content: string;
  showToolbar?: boolean;
  viewMode?: "desktop" | "tablet" | "mobile";
  onViewModeChange?: (mode: "desktop" | "tablet" | "mobile") => void;
  isStreaming?: boolean;
}

function PureHtmlPreview({
  content,
  showToolbar = true,
  viewMode: externalViewMode,
  onViewModeChange,
  isStreaming = false,
}: HtmlPreviewProps) {
  const tArtifact = useTranslations("Artifact");
  const [internalViewMode, setInternalViewMode] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");

  // iframe 引用和状态管理
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastContentRef = useRef<string>("");
  const isUserInteracting = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 使用外部控制的 viewMode 或内部状态
  const viewMode = externalViewMode || internalViewMode;
  const setViewMode = onViewModeChange || setInternalViewMode;

  // 初始化 iframe
  useEffect(() => {
    if (iframeRef.current && !lastContentRef.current) {
      // 首次加载时设置初始内容
      lastContentRef.current = content;
      iframeRef.current.srcdoc = content;
    }

    return () => {
      // 清理定时器
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [content]); // 添加 content 依赖

  // 监听用户交互
  const setupInteractionListeners = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    try {
      const handleUserInteraction = () => {
        isUserInteracting.current = true;

        // 清除之前的超时
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // 500ms 后认为用户停止交互
        scrollTimeoutRef.current = setTimeout(() => {
          isUserInteracting.current = false;
        }, 500);
      };

      // 监听多种用户交互事件
      const events = ["scroll", "mousedown", "touchstart", "keydown"];
      for (const event of events) {
        iframe.contentWindow?.addEventListener(event, handleUserInteraction, {
          passive: true,
        });
      }

      return () => {
        for (const event of events) {
          iframe.contentWindow?.removeEventListener(
            event,
            handleUserInteraction
          );
        }
      };
    } catch (error) {
      // 跨域或其他错误时忽略
      console.warn("Failed to setup interaction listeners:", error);
    }
  }, []);

  // 智能内容更新
  const updateIframeContent = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !content) return;

    const currentContent = lastContentRef.current;

    // 如果内容没有变化，跳过更新
    if (currentContent === content) return;

    // 如果正在 streaming 且用户正在交互，延迟更新
    if (isStreaming && isUserInteracting.current) {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        updateIframeContent();
      }, 1000);
      return;
    }

    // 保存滚动位置
    let scrollPosition = { x: 0, y: 0 };
    try {
      if (iframe.contentWindow) {
        scrollPosition = {
          x: iframe.contentWindow.scrollX,
          y: iframe.contentWindow.scrollY,
        };
      }
    } catch (error) {
      // 跨域错误时忽略
    }

    // 更新内容
    lastContentRef.current = content;
    iframe.srcdoc = content;

    // 内容加载后恢复滚动位置
    const handleLoad = () => {
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.scrollTo(scrollPosition.x, scrollPosition.y);
        }
      } catch (error) {
        // 跨域错误时忽略
      }

      // 重新设置交互监听器
      setupInteractionListeners();

      iframe.removeEventListener("load", handleLoad);
    };

    iframe.addEventListener("load", handleLoad);
  }, [content, isStreaming, setupInteractionListeners]);

  // 内容变化时更新 iframe
  useEffect(() => {
    updateIframeContent();
  }, [updateIframeContent]);

  // iframe 初始加载完成后的处理
  const handleIframeLoad = useCallback(() => {
    // 设置交互监听器
    setupInteractionListeners();
  }, [setupInteractionListeners]);

  const getViewportClass = () => {
    switch (viewMode) {
      case "mobile":
        return "w-80 max-w-full h-full";
      case "tablet":
        return "w-[768px] max-w-full h-full";
      default:
        return "w-full h-full";
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 预览工具栏 - 可选显示 */}
      {showToolbar && (
        <PreviewToolbar
          content={content}
          filename="index.html"
          mimeType="text/html"
        >
          <Globe className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {tArtifact("htmlPreview")}
          </span>

          {/* 响应式视图切换 */}
          <div className="flex items-center gap-1 p-1 bg-background/50 rounded-md border ml-3">
            <Button
              variant={viewMode === "desktop" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("desktop")}
              className="h-5 w-5 p-0"
              title={tArtifact("desktopView")}
            >
              <Monitor className="w-2.5 h-2.5" />
            </Button>
            <Button
              variant={viewMode === "tablet" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("tablet")}
              className="h-5 w-5 p-0"
              title={tArtifact("tabletView")}
            >
              <Tablet className="w-2.5 h-2.5" />
            </Button>
            <Button
              variant={viewMode === "mobile" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("mobile")}
              className="h-5 w-5 p-0"
              title={tArtifact("mobileView")}
            >
              <Smartphone className="w-2.5 h-2.5" />
            </Button>
          </div>
        </PreviewToolbar>
      )}

      {/* 预览区域 */}
      <div className="flex-1 bg-gradient-to-br from-muted/10 to-muted/30 relative">
        {viewMode === "desktop" ? (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0 bg-white dark:bg-gray-900"
            sandbox="allow-scripts allow-same-origin"
            title="HTML Preview"
            onLoad={handleIframeLoad}
          />
        ) : (
          <div className="flex items-center justify-center h-full p-6">
            <div
              className={cn(
                "bg-white dark:bg-gray-900 border-2 border-border/30 shadow-lg rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl",
                getViewportClass()
              )}
            >
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
                title="HTML Preview"
                onLoad={handleIframeLoad}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 优化重新渲染的比较函数
function areEqual(prevProps: HtmlPreviewProps, nextProps: HtmlPreviewProps) {
  // 如果正在 streaming，总是重新渲染以获取最新内容
  if (prevProps.isStreaming && nextProps.isStreaming) return false;

  // 检查其他属性是否变化
  if (prevProps.content !== nextProps.content) return false;
  if (prevProps.showToolbar !== nextProps.showToolbar) return false;
  if (prevProps.viewMode !== nextProps.viewMode) return false;
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;

  return true;
}

export const HtmlPreview = memo(PureHtmlPreview, areEqual);
