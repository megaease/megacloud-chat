// components/artifact/ReactAppViewer.tsx
"use client";

import React, { useState, useEffect } from "react";
import { CodeEditor } from "@/components/code-editor";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactAppContent, UIArtifact } from "@/lib/artifact-types";
import { FileTree, buildFileTree } from "./FileTree";
import { Loader2, ExternalLink, Download, Play, RotateCcw, Globe, Code, Eye, Square } from "lucide-react";

interface ReactAppViewerProps {
  artifact: UIArtifact;
  onPreview?: (artifactId: string) => Promise<void>;
}

export function ReactAppViewer({ artifact, onPreview }: ReactAppViewerProps) {
  const [content, setContent] = useState<ReactAppContent | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [isCheckingSandbox, setIsCheckingSandbox] = useState(false);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(artifact.content) as ReactAppContent;
      setContent(parsed);

      // Select the first file by default
      if (parsed.files && parsed.files.length > 0 && parsed.files[0]) {
        setSelectedFile(parsed.files[0].path);
      }
    } catch (error) {
      console.error("Failed to parse React app content:", error);
    }
  }, [artifact.content]);

  // Auto-fetch preview URL when component mounts
  useEffect(() => {
    const checkPreviewUrl = async () => {
      try {
        await fetchPreviewUrl();
      } catch (error) {
        console.log("Preview not available yet");
      }
    };

    checkPreviewUrl();
  }, []);

  // 页面离开或组件卸载时清理sandbox
  useEffect(() => {
    return () => {
      // 组件卸载时停止sandbox
      cleanupSandbox();
    };
  }, []);

  // 监听页面离开事件
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 页面离开前停止sandbox
      cleanupSandbox();
    };

    const handleVisibilityChange = () => {
      // 页面隐藏时停止sandbox（可选）
      if (document.hidden) {
        // 可以选择在页面隐藏时停止，或者只是监听离开事件
        // cleanupSandbox();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const cleanupSandbox = async () => {
    try {
      const response = await fetch("/api/react-app/sandbox/server/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "user-id",
          artifactId: artifact.documentId,
        }),
      });

      if (response.ok) {
        console.log("Sandbox cleaned up successfully");
      }
    } catch (error) {
      console.error("Failed to cleanup sandbox:", error);
    }
  };

  const checkSandboxStatus = async () => {
    try {
      const response = await fetch("/api/react-app/preview/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "user-id",
          artifactId: artifact.documentId,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error checking sandbox status:", error);
      return { success: false, sandboxExists: false };
    }
  };

  const fetchPreviewUrl = async () => {
    try {
      setStatusMessage("正在检查预览环境...");

      const response = await fetch("/api/react-app/preview/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "user-id", // 使用与创建时相同的用户 ID
          artifactId: artifact.documentId,
        }),
      });

      const data = await response.json();
      if (data.success && data.previewUrl) {
        setPreviewUrl(data.previewUrl);
        setStatusMessage(data.message || "预览就绪");
        setTimeout(() => setStatusMessage(""), 3000);
        return data.previewUrl;
      }

      // Handle different error scenarios
      if (data.sandboxExists) {
        setStatusMessage("正在启动开发服务器...");
      } else {
        setStatusMessage("正在重建预览环境...");
        console.error("Failed to get preview URL:", data.error);
      }

      return null;
    } catch (error) {
      console.error("Error calling preview API:", error);
      setStatusMessage("预览服务暂时不可用");
      return null;
    }
  };

  const handleTabChange = async (tab: "code" | "preview") => {
    if (tab === "preview") {
      setIsCheckingSandbox(true);
      setActiveTab(tab);
      
      try {
        // 检查sandbox状态
        const status = await checkSandboxStatus();
        
        if (status.success && status.sandboxExists && status.isRunning && status.previewUrl) {
          // Sandbox正在运行，直接使用已有的previewUrl
          setPreviewUrl(status.previewUrl);
          setIsSandboxRunning(true);
          setStatusMessage("预览就绪");
          setTimeout(() => setStatusMessage(""), 2000);
        } else {
          // Sandbox已关闭或不存在，需要重新启动
          setIsSandboxRunning(false);
          setStatusMessage("正在重启预览环境...");
          const url = await fetchPreviewUrl();
          if (url) {
            setIsSandboxRunning(true);
            setStatusMessage("预览就绪");
            setTimeout(() => setStatusMessage(""), 2000);
          }
        }
      } catch (error) {
        console.error("Error checking sandbox:", error);
        setStatusMessage("预览环境启动失败");
        setShowRetryButton(true);
      } finally {
        setIsCheckingSandbox(false);
      }
    } else {
      setActiveTab(tab);
      setShowRetryButton(false); // 切换到code模式时重置重试状态
    }
  };

  const handleRetry = async () => {
    setShowRetryButton(false);
    setIsCheckingSandbox(true);
    setStatusMessage("正在重试启动预览环境...");
    
    try {
      const url = await fetchPreviewUrl();
      if (url) {
        setIsSandboxRunning(true);
        setStatusMessage("预览就绪");
        setTimeout(() => setStatusMessage(""), 2000);
      } else {
        setStatusMessage("启动失败，请重试");
        setShowRetryButton(true);
      }
    } catch (error) {
      console.error("Retry failed:", error);
      setStatusMessage("启动失败，请重试");
      setShowRetryButton(true);
    } finally {
      setIsCheckingSandbox(false);
    }
  };

  const handleStopSandbox = async () => {
    try {
      setStatusMessage("正在停止sandbox...");
      await cleanupSandbox();
      setIsSandboxRunning(false);
      setPreviewUrl(null);
      setStatusMessage("Sandbox已停止");
      setTimeout(() => setStatusMessage(""), 2000);
    } catch (error) {
      console.error("Failed to stop sandbox:", error);
      setStatusMessage("停止失败");
    }
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      const url = await fetchPreviewUrl();
      if (url) {
        // 在新窗口中打开预览
        window.open(url, "_blank");
      } else {
        // 如果获取失败，可能是 sandbox 正在重建，等待一下再试
        console.log(
          "Preview URL not available yet, waiting for sandbox recreation..."
        );
        setTimeout(async () => {
          const retryUrl = await fetchPreviewUrl();
          if (retryUrl) {
            window.open(retryUrl, "_blank");
          }
        }, 5000); // 等待 5 秒后重试
      }
    } catch (error) {
      console.error("Failed to start preview:", error);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleDownload = () => {
    if (!content) return;

    // Create a zip file in memory
    const zip = require("jszip")();

    // Add all files to zip
    for (const file of content.files) {
      zip.file(file.path, file.content);
    }

    // Generate and download zip
    zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${artifact.title}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const selectedFileContent = content?.files.find(
    (f) => f.path === selectedFile
  );

  if (!content) {
    return (
      <div className="w-full h-full bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading React app...</span>
        </div>
      </div>
    );
  }

  const fileTree = buildFileTree(content.files);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Combined Toolbar and Status */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-background relative">
        {/* Status Message - Integrated into toolbar */}
        {statusMessage && (
          <div className="text-xs text-muted-foreground animate-pulse absolute left-4 top-1/2 -translate-y-1/2">
            {statusMessage}
          </div>
        )}
        {/* Left Side - Code/Preview Tabs Only */}
        <div className="flex items-center ml-20">
          <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as "code" | "preview")} className="h-full">
            <TabsList className="grid w-16 grid-cols-2 h-7">
              <TabsTrigger value="code" className="p-0" title="Code">
                <Code className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="preview" className="p-0" title="Preview">
                <Eye className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Center URL Control Bar - Show only in preview mode */}
        <div className="flex-1 max-w-2xl mx-4">
          {activeTab === "preview" ? (
            isCheckingSandbox || !previewUrl ? (
              <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {statusMessage || "正在准备预览环境..."}
                </span>
                {showRetryButton && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={handleRetry}
                    title="重试"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-sm">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={previewUrl}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-muted-foreground border-none outline-none cursor-text"
                  aria-label="Preview URL"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => window.open(previewUrl, "_blank")}
                  title="Open in New Tab"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={handlePreview}
                  disabled={isPreviewing}
                  title="Refresh Preview"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          ) : activeTab === "code" ? (
            <div className="text-center">
              <span className="text-sm text-muted-foreground">Code Editor</span>
            </div>
          ) : null}
        </div>

        {/* Right Side - Action Buttons */}
        <div className="flex items-center gap-1">
          {onPreview && (
            <Button
              onClick={handlePreview}
              disabled={isPreviewing}
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              title="Start Preview"
            >
              {isPreviewing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          {isSandboxRunning && (
            <Button
              onClick={handleStopSandbox}
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              title="Stop Sandbox"
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button 
            onClick={handleDownload} 
            variant="ghost" 
            size="sm"
            className="h-7 w-7 p-0"
            title="Download Project"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        <Tabs value={activeTab} className="h-full">

          <TabsContent value="code" className="mt-0 h-full data-[state=active]:flex flex-col">
            <div className="flex-1 min-h-0 flex">
              {/* File Tree */}
              <div className="w-64 border-r bg-background">
                <ScrollArea className="h-full">
                  <div className="p-2">
                    <FileTree
                      nodes={fileTree}
                      selectedFile={selectedFile}
                      onFileSelect={setSelectedFile}
                    />
                  </div>
                </ScrollArea>
              </div>

              {/* Code Editor */}
              <div className="flex-1 bg-background">
                {selectedFileContent ? (
                  <CodeEditor
                    value={selectedFileContent.content}
                    language={selectedFileContent.language}
                    editable={false}
                    className="h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-muted-foreground">
                      Select a file to view
                    </span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {previewUrl && (
            <TabsContent value="preview" className="mt-0 h-full data-[state=active]:flex flex-col">
              <div className="flex-1 bg-background">
                <div className="h-full w-full">
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title={`${artifact.title} Preview`}
                  />
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}