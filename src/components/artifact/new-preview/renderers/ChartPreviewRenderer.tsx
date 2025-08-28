"use client";

import React from "react";
import { NewImagePreview } from "../NewImagePreview";
import type { PreviewProps } from "../types";

export function ChartPreviewRenderer({
  content,
  language,
  className = "",
}: PreviewProps) {
  return (
    <NewImagePreview
      content={content}
      className={className}
      showToolbar={true}
      canZoom={false}
      canRotate={false}
      canFullscreen={true}
      initialViewMode="preview"
    />
  );
}
