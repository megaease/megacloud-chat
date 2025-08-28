"use client";

import React from "react";
import { NewImagePreview } from "../NewImagePreview";
import type { PreviewProps } from "../types";

export function ImagePreviewRenderer({
  content,
  language,
  className = "",
}: PreviewProps) {
  return (
    <NewImagePreview
      content={content}
      className={className}
      showToolbar={true}
      canZoom={true}
      canRotate={true}
      canFullscreen={true}
      initialViewMode="preview"
    />
  );
}
