"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { cn } from "@/lib/utils";

interface HtmlPreviewProps {
	content: string;
}

export const HtmlPreview = ({ content }: HtmlPreviewProps) => {
	const tArtifact = useTranslations("Artifact");
	const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">(
		"desktop",
	);

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
			{/* 工具栏 */}
			<div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20 backdrop-blur-sm flex-shrink-0">
				<div className="flex items-center gap-2">
					<div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
					<Monitor className="w-4 h-4 text-primary" />
					<span className="text-sm font-medium text-foreground">
						{tArtifact("htmlPreview")}
					</span>
				</div>
				<div className="flex items-center gap-1 p-1 bg-background/50 rounded-md border">
					<Button
						variant={viewMode === "desktop" ? "default" : "ghost"}
						size="sm"
						onClick={() => setViewMode("desktop")}
						className="h-7 w-7 p-0 transition-all duration-200 hover:scale-105"
						title={tArtifact("desktopView")}
					>
						<Monitor className="w-3.5 h-3.5" />
					</Button>
					<Button
						variant={viewMode === "tablet" ? "default" : "ghost"}
						size="sm"
						onClick={() => setViewMode("tablet")}
						className="h-7 w-7 p-0 transition-all duration-200 hover:scale-105"
						title={tArtifact("tabletView")}
					>
						<Tablet className="w-3.5 h-3.5" />
					</Button>
					<Button
						variant={viewMode === "mobile" ? "default" : "ghost"}
						size="sm"
						onClick={() => setViewMode("mobile")}
						className="h-7 w-7 p-0 transition-all duration-200 hover:scale-105"
						title={tArtifact("mobileView")}
					>
						<Smartphone className="w-3.5 h-3.5" />
					</Button>
				</div>
			</div>

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
