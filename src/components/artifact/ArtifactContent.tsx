// components/artifact/ArtifactContent.tsx
"use client";

import { useArtifact } from "@/context/artifact-provider-context";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { CodePreview } from "./CodePreview";
import { TextArtifact } from "./TextArtifact";
import { TablePreview } from "./previews";
import { VisualPreview } from "./previews/VisualPreview";
import { NewCodePreview } from "./new-preview/NewCodePreview";
import { NewImagePreview } from "./new-preview/NewImagePreview";
import { PreviewPluginProvider } from "./new-preview/PreviewPluginRegistry";
import { PreviewProvider } from "./new-preview/PreviewContext";
import { ExecutionProvider } from "./new-preview/ExecutionContext";

export function ArtifactContent() {
  const { artifact } = useArtifact();
  const tArtifact = useTranslations("Artifact");

  // 直接使用 artifact context 中的数据
  const displayData = {
    kind: artifact.kind,
    content: artifact.content,
    title: artifact.title,
    language: artifact.language,
  };
  const displayStatus = artifact.status;

  // 创建一个稳定的 key，避免在流式传输时重新挂载组件
  // 只在 kind 变化时才重新挂载，内容变化不应该触发重新挂载
  const contentKey = `${displayData.kind}-stable`;

  // Render content based on kind
  const renderContent = () => {
    // 如果是 error 状态，显示错误信息
    if (displayStatus === "error") {
      return (
        <motion.div
          className="h-full flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="bg-gradient-to-br from-red-50/50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/20 rounded-xl border border-red-200/50 dark:border-red-800/50 backdrop-blur-sm w-full h-full flex items-center justify-center">
            <div className="text-center space-y-6 p-8">
              <motion.div
                className="relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <div className="w-16 h-16 mx-auto bg-red-100/80 dark:bg-red-900/80 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">⚠️</span>
                </div>
              </motion.div>
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                  {tArtifact("failedToLoadContent")}
                </p>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 max-w-xs mx-auto leading-relaxed">
                  {displayData.content || tArtifact("errorLoadingDocument")}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      );
    }

    // 如果 kind 为空或无效，且状态为 streaming，显示加载状态而不是"不支持的类型"
    if (
      !displayData.kind ||
      !["text", "code", "sheet", "image"].includes(displayData.kind)
    ) {
      if (displayStatus === "streaming" || displayStatus === "loading") {
        return (
          <motion.div
            className="h-full flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="bg-gradient-to-br from-muted/10 to-muted/30 rounded-xl border border-border/50 backdrop-blur-sm w-full h-full flex items-center justify-center">
              <div className="text-center space-y-6 p-8">
                <motion.div
                  className="relative"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                >
                  <div className="w-16 h-16 mx-auto bg-muted/30 rounded-2xl flex items-center justify-center shadow-lg">
                    <motion.div
                      className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                    />
                  </div>
                </motion.div>
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <p className="text-sm font-semibold text-foreground">
                    {tArtifact("loading")}
                  </p>
                  <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto leading-relaxed">
                    {tArtifact("preparingContent")}
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        );
      }
    }

    switch (displayData.kind) {
      case "code": { // Use new CodePreview implementation for all languages including Python
        const canExecute =
          displayData.language === "javascript" ||
          displayData.language === "python";
        const canPreview =
          displayData.language === "html" || displayData.language === "react";
        return (
          <motion.div
            className="h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <PreviewPluginProvider>
              <PreviewProvider>
                <ExecutionProvider>
                  <NewCodePreview
                    content={displayData.content}
                    language={displayData.language || "javascript"}
                    className="h-full"
                    initialViewMode="code"
                    canExecute={canExecute}
                    canPreview={canPreview}
                    showViewModeSelector={canPreview}
                  />
                </ExecutionProvider>
              </PreviewProvider>
            </PreviewPluginProvider>
          </motion.div>
        );
      }

      case "text":
        return (
          <motion.div
            className="h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <TextArtifact
              content={displayData.content}
              title={displayData.title}
              status={displayStatus}
            />
          </motion.div>
        );

      case "sheet":
        return (
          <motion.div
            className="h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <TablePreview
              content={displayData.content}
              status={displayStatus}
              showToolbar={true}
            />
          </motion.div>
        );

      case "image":
        return (
          <motion.div
            className="h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <NewImagePreview
              content={displayData.content}
              title={displayData.title}
              className="h-full"
              status={displayStatus}
              showToolbar={true}
              canZoom={true}
              canRotate={true}
              canFullscreen={true}
              initialViewMode="preview"
            />
          </motion.div>
        );

      default:
        return (
          <motion.div
            className="h-full flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="bg-gradient-to-br from-muted/10 to-muted/30 rounded-xl border border-border/50 backdrop-blur-sm w-full h-full flex items-center justify-center">
              <div className="text-center space-y-6 p-8">
                <motion.div
                  className="relative"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                >
                  <div className="w-20 h-20 mx-auto bg-muted/30 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">📄</span>
                  </div>
                  <div className="absolute inset-0 w-20 h-20 mx-auto border-2 border-dashed border-muted-foreground/30 rounded-2xl" />
                </motion.div>
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <p className="text-sm font-semibold text-foreground">
                    {tArtifact("unsupportedContentType")}
                  </p>
                  <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto leading-relaxed">
                    {tArtifact("contentTypeNotSupported", {
                      kind: displayData.kind,
                    })}
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
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
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="h-full relative z-10"
      >
        {renderContent()}
      </motion.div>
    </AnimatePresence>
  );
}
