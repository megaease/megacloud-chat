"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ExternalLink } from "lucide-react";

interface HtmlPreviewRendererProps {
  code: string;
  className?: string;
}

export function HtmlPreviewRenderer({
  code,
  className = "",
}: HtmlPreviewRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updatePreview = useCallback(() => {
    if (!iframeRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const iframe = iframeRef.current;
      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;

      if (!iframeDoc) {
        throw new Error("Cannot access iframe document");
      }

      // Create a complete HTML document
      const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: white;
    }
    /* Reset default styles */
    * {
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;

      iframeDoc.open();
      iframeDoc.write(fullHtml);
      iframeDoc.close();

      // Set up error handling
      iframe.onerror = () => {
        setError("Failed to load preview");
        setIsLoading(false);
      };

      // Check if iframe loaded successfully
      iframe.onload = () => {
        setIsLoading(false);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to render HTML");
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  const handleRefresh = () => {
    updatePreview();
  };

  const handleOpenInNewTab = () => {
    try {
      const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: white;
    }
    * {
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;

      const blob = new Blob([fullHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      // Clean up the URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Failed to open in new tab:", err);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Toolbar */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="bg-background/80 backdrop-blur-sm"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenInNewTab}
          className="bg-background/80 backdrop-blur-sm"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading preview...
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/5">
          <div className="text-sm text-destructive">
            <strong>Error:</strong> {error}
          </div>
        </Card>
      )}

      {/* Iframe preview */}
      <iframe
        ref={iframeRef}
        className="w-full h-full border rounded-md bg-white"
        title="HTML Preview"
        sandbox="allow-scripts allow-same-origin"
        style={{ minHeight: "400px" }}
      />
    </div>
  );
}
