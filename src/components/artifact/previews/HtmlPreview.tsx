"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Code, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useState } from "react";
import { CodeBlock, CodeBlockCode } from "@/components/prompt-kit/code-block";

interface HtmlPreviewProps {
  content: string;
  showToolbar?: boolean;
  className?: string;
}

function PureHtmlPreview({
  content,
  showToolbar = true,
  className,
}: HtmlPreviewProps) {
  const tArtifact = useTranslations("Artifact");
  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* 工具栏 */}
      {showToolbar && (
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/20 flex-shrink-0 min-h-[36px]">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {tArtifact("htmlPreview")}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant={showPreview ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowPreview(true)}
              className="h-7 px-2 text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              预览
            </Button>
            <Button
              variant={!showPreview ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowPreview(false)}
              className="h-7 px-2 text-xs"
            >
              <EyeOff className="w-3 h-3 mr-1" />
              代码
            </Button>
          </div>
        </div>
      )}

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        1
        {showPreview ? (
          // HTML 预览
          <div className="w-full h-full bg-white dark:bg-gray-900">
            <iframe
              srcDoc={content}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title="HTML Preview"
            />
          </div>
        ) : (
          // 代码显示
          <div className="w-full h-full">
            <CodeBlock className="h-full border-0 rounded-none">
              1
              <CodeBlockCode
                code={content}
                language="html"
                className="h-full [&>pre]:h-full [&>pre]:!max-h-none"
              />
            </CodeBlock>
          </div>
        )}
      </div>
    </div>
  );
}

export const HtmlPreview = memo(PureHtmlPreview);
