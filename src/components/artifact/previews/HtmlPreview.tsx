"use client";

import { useState } from "react";
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
}

export const HtmlPreview = ({ 
	content, 
	showToolbar = true, 
	viewMode: externalViewMode,
	onViewModeChange 
}: HtmlPreviewProps) => {
	const tArtifact = useTranslations("Artifact");
	const [internalViewMode, setInternalViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
	
	// 使用外部控制的 viewMode 或内部状态
	const viewMode = externalViewMode || internalViewMode;
	const setViewMode = onViewModeChange || setInternalViewMode;

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
						srcDoc={content}
						className="w-full h-full border-0 bg-white dark:bg-gray-900"
						sandbox="allow-scripts allow-same-origin"
						title="HTML Preview"
					/>
				) : (
					<div className="flex items-center justify-center h-full p-6">
						<div
							className={cn(
								"bg-white dark:bg-gray-900 border-2 border-border/30 shadow-lg rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl",
								getViewportClass(),
							)}
						>
							<iframe
								srcDoc={content}
								className="w-full h-full border-0"
								sandbox="allow-scripts allow-same-origin"
								title="HTML Preview"
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
