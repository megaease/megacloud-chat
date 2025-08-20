"use client";

import { CodeEditor } from "@/components/code-editor";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ArtifactKind, ArtifactLanguage } from "@/lib/artifact-types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  Globe,
  Loader2,
  Monitor,
  Package,
  Play,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { HtmlPreview, ReactPreview } from "./previews";
import {
  getLanguage,
  getLanguageDisplayName,
  getPreviewType,
  isPreviewSupported,
} from "./utils/language-detector";

// Pyodide 类型定义
interface PyodideInterface {
  runPython: (code: string) => unknown;
  loadPackage: (packages: string[]) => Promise<void>;
}

declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<PyodideInterface>;
    pyodide: PyodideInterface;
  }
}

interface CodePreviewProps {
  content: string;
  language?: ArtifactLanguage;
  kind?: ArtifactKind;
  className?: string;
  status?: "idle" | "streaming" | "error" | "loading";
}

export function CodePreview({
  content,
  language,
  className,
  status = "idle",
}: CodePreviewProps) {
  const tArtifact = useTranslations("Artifact");
  const tCommon = useTranslations("Common");
  // 默认显示代码，在流式传输时强制显示代码视图
  const [viewMode, setViewMode] = useState<"code" | "preview">("code");

  // 在流式传输时强制切换到代码视图
  useEffect(() => {
    if (status === "streaming" && viewMode === "preview") {
      setViewMode("code");
    }
  }, [status, viewMode]);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [htmlViewMode, setHtmlViewMode] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");
  const [isExecuting, setIsExecuting] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [consoleError, setConsoleError] = useState<string>("");

  // Python 特定状态
  const [pyodideReady, setPyodideReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const pyodideRef = useRef<PyodideInterface | null>(null);

  const finalLanguage = getLanguage(language, content);
  const previewType = getPreviewType(finalLanguage);
  const canPreview = isPreviewSupported(finalLanguage);

  // 修复滚动问题：直接使用原始内容，避免影响 CodeMirror 的滚动
  const displayContent = content;

  // Python Pyodide 懒加载 - 不自动预加载
  useEffect(() => {
    if (previewType !== "python") return;

    // 只检查是否已经存在现成的 Pyodide 实例
    if (window.pyodide || pyodideRef.current) {
      setPyodideReady(true);
    }
  }, [previewType]);

  // 初始化 Pyodide
  const initializePyodide = useCallback(async () => {
    if (pyodideRef.current || isInitializing) return;

    setIsInitializing(true);
    setPreloadProgress(20);

    try {
      if (typeof window.loadPyodide !== "function") {
        console.log("Pyodide script not loaded yet, loading...");
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
        script.async = true;
        document.head.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      setPreloadProgress(50);

      console.log("Initializing Pyodide...");
      pyodideRef.current = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
      });

      setPreloadProgress(80);

      // 重定向 stdout 和 stderr
      pyodideRef.current.runPython(`
import sys
from io import StringIO

class OutputCapture:
    def __init__(self):
        self.output = StringIO()
        
    def write(self, text):
        self.output.write(text)
        
    def flush(self):
        pass
        
    def get_output(self):
        return self.output.getvalue()
        
    def clear(self):
        self.output = StringIO()

_output_capture = OutputCapture()
sys.stdout = _output_capture
sys.stderr = _output_capture
			`);

      setPreloadProgress(100);
      setPyodideReady(true);
      console.log("Pyodide initialized successfully!");
    } catch (err) {
      setConsoleError(
        `${tArtifact("pyodideInitFailed")}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      console.error("Pyodide initialization failed:", err);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, tArtifact]);

  // 安装包
  const installPackage = async (packageName: string) => {
    if (!pyodideRef.current) {
      await initializePyodide();
      if (!pyodideRef.current) return;
    }

    setIsExecuting(true);
    try {
      await pyodideRef.current.loadPackage([packageName]);
      setConsoleOutput(
        (prev) =>
          `${prev ? `${prev}\n` : ""}✅ ${tArtifact(
            "packageInstalled"
          )}: ${packageName}`
      );
    } catch (err) {
      setConsoleError(
        `${tArtifact("packageInstallFailed")}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setIsExecuting(false);
    }
  };

  // 执行代码
  const handleExecute = async () => {
    if (previewType === "python" || previewType === "javascript") {
      setIsExecuting(true);
      setConsoleOutput("");
      setConsoleError("");

      try {
        if (previewType === "javascript") {
          // JavaScript 执行逻辑
          const logs: string[] = [];
          const originalLog = console.log;
          console.log = (...args) => {
            logs.push(
              args
                .map((arg) =>
                  typeof arg === "object"
                    ? JSON.stringify(arg, null, 2)
                    : String(arg)
                )
                .join(" ")
            );
          };

          // eslint-disable-next-line no-new-func
          const func = new Function(content);
          const result = func();
          console.log = originalLog;

          if (result !== undefined) {
            logs.push(
              `${tArtifact("returnValue")}: ${
                typeof result === "object"
                  ? JSON.stringify(result, null, 2)
                  : String(result)
              }`
            );
          }

          setConsoleOutput(
            logs.join("\n") || tArtifact("codeExecutionComplete")
          );
        } else if (previewType === "python") {
          // Python 执行逻辑
          if (!pyodideRef.current) {
            await initializePyodide();
            if (!pyodideRef.current) return;
          }

          // 清空之前的输出
          pyodideRef.current.runPython("_output_capture.clear()");

          // 执行用户代码
          const result = pyodideRef.current.runPython(content);

          // 获取输出
          const capturedOutput = pyodideRef.current.runPython(
            "_output_capture.get_output()"
          ) as string;

          let finalOutput = capturedOutput || "";

          // 如果有返回值且不是 None，添加到输出
          if (result !== undefined && result !== null) {
            const resultStr = String(result);
            if (resultStr !== "None") {
              finalOutput = `${finalOutput}${
                finalOutput ? "\n" : ""
              }${tArtifact("output")}: ${resultStr}`;
            }
          }

          setConsoleOutput(finalOutput || tArtifact("codeExecutionComplete"));
        }
      } catch (error) {
        setConsoleError(
          `${tArtifact("executionError")}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        setIsExecuting(false);
      }
    }
  };

  // 如果正在流式传输，显示实时内容而不是骨架屏
  // 注释掉骨架屏，让用户可以看到流式内容逐步出现
  // if (status === "streaming") {
  // 	return <CodeSkeleton className={className} />;
  // }

  // 复制功能
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  // 下载功能
  const handleDownload = () => {
    const getFileExtension = () => {
      switch (previewType) {
        case "html":
          return "html";
        case "react":
          return "jsx";
        case "javascript":
          return "js";
        case "python":
          return "py";
        default:
          return "txt";
      }
    };

    const getMimeType = () => {
      switch (previewType) {
        case "html":
          return "text/html";
        case "react":
        case "javascript":
          return "text/javascript";
        case "python":
          return "text/x-python";
        default:
          return "text/plain";
      }
    };

    const filename = `code.${getFileExtension()}`;
    const blob = new Blob([content], { type: getMimeType() });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderPreview = () => {
    switch (previewType) {
      case "html":
        return <HtmlPreview content={content} showToolbar={false} />;
      case "react":
        return <ReactPreview content={content} showToolbar={false} />;
      case "javascript":
      case "python":
        // JavaScript 和 Python 现在在代码视图中有完整的控制台，不需要预览
        return (
          <motion.div
            className="flex items-center justify-center h-full text-muted-foreground"
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
                  <Code2 className="w-20 h-20 mx-auto opacity-30" />
                  <div className="absolute inset-0 w-20 h-20 mx-auto border-2 border-dashed border-muted-foreground/30 rounded-2xl" />
                </motion.div>
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <p className="text-sm font-semibold text-foreground">
                    {tArtifact("codeExecutionInCodeView")}
                  </p>
                  <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto leading-relaxed">
                    {tArtifact("switchToCodeView", {
                      language:
                        previewType === "python" ? "Python" : "JavaScript",
                    })}
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        );
      default:
        return (
          <motion.div
            className="flex items-center justify-center h-full text-muted-foreground"
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
                  <Code2 className="w-20 h-20 mx-auto opacity-30" />
                  <div className="absolute inset-0 w-20 h-20 mx-auto border-2 border-dashed border-muted-foreground/30 rounded-2xl" />
                </motion.div>
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <p className="text-sm font-semibold text-foreground">
                    {tArtifact("previewNotSupported")}
                  </p>
                  <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto leading-relaxed">
                    {tArtifact("languageNotSupported", {
                      language: getLanguageDisplayName(finalLanguage),
                    })}
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  // 渲染预览工具（针对不同类型的预览）
  const renderPreviewTools = () => {
    if (viewMode !== "preview" || !canPreview) return null;

    const getPreviewConfig = (type: string) => {
      switch (type) {
        case "html":
          return {
            icon: Globe,
            label: tArtifact("htmlPreview"),
            hasViewModes: true,
          };
        case "react":
          return {
            icon: Code2,
            label: tArtifact("reactComponentPreview"),
            hasViewModes: false,
          };
        case "python":
          return {
            icon: Code2,
            label: tArtifact("pythonExecutor"),
            hasViewModes: false,
          };
        case "javascript":
          return {
            icon: Code2,
            label: tArtifact("javascriptExecutor"),
            hasViewModes: false,
          };
        default:
          return null;
      }
    };

    const config = getPreviewConfig(previewType);
    if (!config) return null;

    const { hasViewModes } = config;

    return (
      <div className="flex items-center gap-3">
        {/* HTML 响应式视图切换 */}
        {hasViewModes && (
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Button
              variant={htmlViewMode === "desktop" ? "default" : "ghost"}
              size="sm"
              onClick={() => setHtmlViewMode("desktop")}
              className="h-6 w-6 p-0"
              title={tArtifact("desktopView")}
            >
              <Monitor className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={htmlViewMode === "tablet" ? "default" : "ghost"}
              size="sm"
              onClick={() => setHtmlViewMode("tablet")}
              className="h-6 w-6 p-0"
              title={tArtifact("tabletView")}
            >
              <Tablet className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={htmlViewMode === "mobile" ? "default" : "ghost"}
              size="sm"
              onClick={() => setHtmlViewMode("mobile")}
              className="h-6 w-6 p-0"
              title={tArtifact("mobileView")}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* 统一工具栏 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm min-h-[44px] gap-3">
        {/* 左侧：语言标识、流式状态和预览工具 */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Code2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:inline">
              {getLanguageDisplayName(finalLanguage)}
            </span>
          </div>

          {/* 流式状态指示器 */}
          {status === "streaming" && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {tArtifact("generating")}
              </span>
            </div>
          )}

          {/* 预览特定的工具 */}
          <div className="hidden lg:block">{renderPreviewTools()}</div>
        </div>

        {/* 右侧：视图切换和工具按钮 */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* 视图切换 - 只对传统预览显示 */}
          {previewType !== "python" && previewType !== "javascript" && (
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as typeof viewMode)}
            >
              <TabsList>
                <TabsTrigger value="code">
                  <Code2 className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">{tArtifact("code")}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  disabled={!canPreview || status === "streaming"}
                >
                  <Eye className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">
                    {tArtifact("preview")}
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* 工具按钮 */}
          <div className="flex items-center gap-2">
            {/* 执行按钮 - 只对 Python/JavaScript 显示 */}
            {(previewType === "python" || previewType === "javascript") && (
              <Button
                variant="outline"
                size="sm"
                onClick={
                  previewType === "python" && !pyodideReady
                    ? initializePyodide
                    : handleExecute
                }
                disabled={
                  isExecuting ||
                  (previewType === "python" && isInitializing) ||
                  status === "streaming"
                }
                className="h-8 px-3 text-sm font-medium gap-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                title={
                  previewType === "python" && !pyodideReady
                    ? tArtifact("initializePythonEnvironment")
                    : tArtifact("executeCode")
                }
              >
                {isExecuting || isInitializing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {isExecuting
                    ? tArtifact("executing")
                    : isInitializing
                    ? tArtifact("initializing")
                    : previewType === "python" && !pyodideReady
                    ? tArtifact("initialize")
                    : tArtifact("execute")}
                </span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!content || status === "streaming"}
              className={cn(
                "h-8 px-3 text-sm font-medium gap-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                copyStatus === "copied"
                  ? "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                  : "hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
              title={
                copyStatus === "copied" ? tCommon("copied") : tCommon("copy")
              }
            >
              {copyStatus === "copied" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {copyStatus === "copied" ? tCommon("copied") : tCommon("copy")}
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!content || status === "streaming"}
              className="h-8 px-3 text-sm font-medium gap-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              title={tCommon("download")}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{tCommon("download")}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* 对于 Python/JavaScript 直接显示代码，不使用 Tabs */}
        {previewType === "python" || previewType === "javascript" ? (
          <motion.div
            className="h-full flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={70} minSize={30}>
                <div className="h-full overflow-hidden">
                  <CodeEditor
                    value={displayContent}
                    language={finalLanguage}
                    showHeader={false}
                    showCopyButton={true}
                    height="100%"
                    className="h-full"
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={30} minSize={20}>
                <div className="h-full bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm flex flex-col border-t border-slate-200 dark:border-slate-800">
                  {/* Console 头部 */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {tArtifact("console")}
                        </span>
                      </div>
                      {(consoleOutput || consoleError) && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                            {tArtifact("active")}
                          </span>
                        </div>
                      )}

                      {/* Python 特定状态 */}
                      {previewType === "python" && !pyodideReady && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                          <span className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
                            {isInitializing
                              ? `${tArtifact(
                                  "initializing"
                                )} ${preloadProgress}%`
                              : tArtifact("notReady")}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Python 包安装按钮 */}
                      {previewType === "python" && pyodideReady && (
                        <div className="flex items-center gap-1 mr-2">
                          {["numpy", "pandas", "matplotlib"].map((pkg) => (
                            <Button
                              key={pkg}
                              variant="outline"
                              size="sm"
                              onClick={() => installPackage(pkg)}
                              disabled={isExecuting}
                              className="h-6 px-2 text-xs border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                              title={`${tArtifact("install")} ${pkg}`}
                            >
                              <Package className="w-2.5 h-2.5 mr-1" />
                              {pkg}
                            </Button>
                          ))}
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setConsoleOutput("");
                          setConsoleError("");
                        }}
                        className="h-7 px-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                        title={tArtifact("clearOutput")}
                      >
                        {tArtifact("clear")}
                      </Button>
                    </div>
                  </div>

                  {/* Console 内容 */}
                  <div className="flex-1 p-4 overflow-auto bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-950/50 dark:to-slate-900/50">
                    {consoleError && (
                      <div className="mb-3 p-3 bg-gradient-to-r from-red-50 to-red-25 dark:from-red-950/50 dark:to-red-900/30 border border-red-200 dark:border-red-800/50 rounded-lg text-red-700 dark:text-red-400 text-sm shadow-sm">
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0 mt-0.5 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              !
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold mb-1 text-red-800 dark:text-red-300">
                              {tArtifact("executionError")}
                            </div>
                            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                              {consoleError}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                    {consoleOutput && (
                      <div className="p-3 bg-gray-900 text-green-400 rounded-lg shadow-lg border border-gray-700">
                        <div className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-2">
                          <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-white" />
                          </div>
                          <span className="text-xs text-gray-400 font-mono font-semibold tracking-wide">
                            OUTPUT
                          </span>
                        </div>
                        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                          {consoleOutput}
                        </pre>
                      </div>
                    )}
                    {!consoleOutput && !consoleError && (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center p-8">
                          {previewType === "python" ? (
                            <>
                              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center">
                                <div className="text-2xl">🐍</div>
                              </div>
                              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                {pyodideReady
                                  ? tArtifact("pythonEnvironmentReady")
                                  : tArtifact("pythonEnvironment")}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-500">
                                {pyodideReady
                                  ? tArtifact("clickExecuteToRun")
                                  : isInitializing
                                  ? `${tArtifact(
                                      "initializing"
                                    )}... ${preloadProgress}%`
                                  : tArtifact("clickInitializeToStart")}
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center">
                                <div className="text-2xl">⚡</div>
                              </div>
                              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                {tArtifact("ready")}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-500">
                                {tArtifact("clickExecuteToViewOutput")}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </motion.div>
        ) : (
          /* 对于其他类型使用 Tabs 组件 */
          <Tabs value={viewMode} className="flex-1 h-full">
            <TabsContent
              value="code"
              className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col"
            >
              <motion.div
                className="flex-1 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <CodeEditor
                  value={displayContent}
                  language={finalLanguage}
                  showHeader={false}
                  showCopyButton={true}
                  height="100%"
                  className="h-full"
                />
              </motion.div>
            </TabsContent>

            <TabsContent
              value="preview"
              className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col"
            >
              <motion.div
                className="flex-1 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {renderPreview()}
              </motion.div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
