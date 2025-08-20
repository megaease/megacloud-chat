"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HtmlPreviewRenderer } from "./renderers/HtmlPreviewRenderer";
import { ReactPreviewRenderer } from "./renderers/ReactPreviewRenderer";
import { CodeExecutionPanel } from "./CodeExecutionPanel";
import {
  Code2,
  Copy,
  Download,
  Eye,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";
import type { ArtifactLanguage } from "@/lib/artifact-types";

interface NewCodePreviewProps {
  content: string;
  language: ArtifactLanguage;
  className?: string;
  initialViewMode?: "code" | "preview" | "split";
  showToolbar?: boolean;
  showViewModeSelector?: boolean;
  canExecute?: boolean;
  canPreview?: boolean;
  canResize?: boolean;
  defaultHeight?: string;
}

export function NewCodePreview({
  content,
  language,
  className = "",
  initialViewMode = "code",
  showToolbar = true,
  showViewModeSelector = true,
  canExecute = false,
  canPreview = true,
  canResize = true,
  defaultHeight = "600px",
}: NewCodePreviewProps) {
  const [viewMode, setViewMode] = useState<"code" | "preview">(
    initialViewMode === "split" ? "code" : initialViewMode
  );
  const [previewSize, setPreviewSize] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const handleToggleViewMode = () => {
    setViewMode((prev) => (prev === "code" ? "preview" : "code"));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to copy content:", error);
    }
  };

  const handleDownload = () => {
    const extensions: Record<string, string> = {
      html: "html",
      css: "css",
      javascript: "js",
      typescript: "ts",
      python: "py",
      jsx: "jsx",
      tsx: "tsx",
      react: "js",
      json: "json",
      markdown: "md",
      sql: "sql",
      text: "txt",
    };

    const extension = extensions[language] || "txt";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderPreview = () => {
    // Cast language to string to handle additional types like jsx, tsx
    const lang = language as string;

    switch (lang) {
      case "html":
        return <HtmlPreviewRenderer code={content} className="w-full h-full" />;
      case "react":
      case "jsx":
      case "tsx":
        return (
          <ReactPreviewRenderer code={content} className="w-full h-full" />
        );
      default:
        return (
          <Card className="p-8 h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">Preview Not Available</p>
              <p className="text-sm">
                Preview is not supported for {language} files.
                {canExecute && " Try executing the code instead."}
              </p>
            </div>
          </Card>
        );
    }
  };

  const renderCodeEditor = () => {
    return (
      <ScrollArea className="h-full w-full">
        <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
          {content}
        </pre>
      </ScrollArea>
    );
  };

  const renderExecutionPanel = () => {
    if (!canExecute) return null;

    return (
      <CodeExecutionPanel
        code={content}
        language={language}
        className="w-full h-full"
      />
    );
  };

  const getPreviewSizeClasses = () => {
    switch (previewSize) {
      case "mobile":
        return "max-w-sm mx-auto";
      case "tablet":
        return "max-w-2xl mx-auto";
      default:
        return "";
    }
  };

  const renderModernCodeEditor = () => {
    return (
      <div className="h-full flex flex-col bg-slate-900 dark:bg-slate-950">
        {/* Code editor header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 dark:bg-slate-900 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Code2 className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-slate-200">
              {language.toUpperCase()}
            </span>
            <Badge variant="secondary" className="text-xs">
              {content.split("\n").length} lines
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-7 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Code content */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-4">
            <pre className="text-sm font-mono text-slate-100 leading-relaxed whitespace-pre-wrap overflow-x-auto">
              {content}
            </pre>
          </div>
        </ScrollArea>
      </div>
    );
  };

  const renderModernPreview = () => {
    return (
      <div className="h-full overflow-auto bg-white dark:bg-slate-900">
        {renderPreview()}
      </div>
    );
  };

  const renderModernExecutionPanel = () => {
    if (!canExecute) return null;

    return (
      <div className="h-48 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <CodeExecutionPanel
          code={content}
          language={language}
          className="w-full h-full"
        />
      </div>
    );
  };

  return (
    <div
      className={`rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-full flex flex-col ${className}`}
    >
      {/* Modern header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Code2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              {language.toUpperCase()}
            </span>
          </div>

          {/* View mode selector */}
          {showViewModeSelector && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <Button
                variant={viewMode === "code" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("code")}
                className="h-7 px-3 text-xs"
              >
                <Code2 className="w-3 h-3 mr-1" />
                Code
              </Button>
              <Button
                variant={viewMode === "preview" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("preview")}
                className="h-7 px-3 text-xs"
                disabled={!canPreview}
              >
                <Eye className="w-3 h-3 mr-1" />
                Preview
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Preview size selector */}
          {viewMode === "preview" && canPreview && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-2">
              <Button
                variant={previewSize === "desktop" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewSize("desktop")}
                className="h-7 px-2 text-xs"
                title="Desktop view"
              >
                <Monitor className="w-3 h-3" />
              </Button>
              <Button
                variant={previewSize === "tablet" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewSize("tablet")}
                className="h-7 px-2 text-xs"
                title="Tablet view"
              >
                <Tablet className="w-3 h-3" />
              </Button>
              <Button
                variant={previewSize === "mobile" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewSize("mobile")}
                className="h-7 px-2 text-xs"
                title="Mobile view"
              >
                <Smartphone className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Action buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-3 text-xs font-medium gap-1.5 border-slate-300 dark:border-slate-600"
          >
            <Copy className="w-3 h-3" />
            {copyStatus === "copied" ? "Copied!" : "Copy"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-8 px-3 text-xs font-medium gap-1.5 border-slate-300 dark:border-slate-600"
          >
            <Download className="w-3 h-3" />
            Download
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="h-[calc(100%-64px)]">
        {viewMode === "code" && (
          <div className="h-full flex flex-col">
            {renderModernCodeEditor()}
            {renderModernExecutionPanel()}
          </div>
        )}

        {viewMode === "preview" && (
          <div
            className={`h-full bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 ${getPreviewSizeClasses()}`}
          >
            {renderModernPreview()}
          </div>
        )}
      </div>

      {/* Modern status bar */}
      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Ready</span>
          </div>
          <span>{content.split("\n").length} lines</span>
          <span>{content.length.toLocaleString()} characters</span>
        </div>
        <div className="flex items-center gap-3">
          {copyStatus === "copied" && (
            <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              ✓ Copied to clipboard
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
