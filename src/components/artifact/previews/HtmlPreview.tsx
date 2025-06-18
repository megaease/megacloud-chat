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
		<div className="flex flex-col h-full">
			{/* 工具栏 */}
			<div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 flex-shrink-0">
				<div className="flex items-center gap-1.5">
					<Monitor className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
					<span className="text-sm font-medium text-blue-700 dark:text-blue-300">
						{tArtifact("htmlPreview")}
					</span>
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant={viewMode === "desktop" ? "default" : "ghost"}
						size="sm"
						onClick={() => setViewMode("desktop")}
						className="h-6 w-6 p-0"
						title={tArtifact("desktopView")}
					>
						<Monitor className="w-3 h-3" />
					</Button>
					<Button
						variant={viewMode === "tablet" ? "default" : "ghost"}
						size="sm"
						onClick={() => setViewMode("tablet")}
						className="h-6 w-6 p-0"
						title={tArtifact("tabletView")}
					>
						<Tablet className="w-3 h-3" />
					</Button>
					<Button
						variant={viewMode === "mobile" ? "default" : "ghost"}
						size="sm"
						onClick={() => setViewMode("mobile")}
						className="h-6 w-6 p-0"
						title={tArtifact("mobileView")}
					>
						<Smartphone className="w-3 h-3" />
					</Button>
				</div>
			</div>

			{/* 预览区域 */}
			<div className="flex-1 bg-muted/20">
				{viewMode === "desktop" ? (
					<iframe
						srcDoc={content}
						className="w-full h-full border-0"
						sandbox="allow-scripts allow-same-origin"
						title="HTML Preview"
					/>
				) : (
					<div className="flex items-center justify-center h-full p-4">
						<div
							className={cn(
								"bg-background border overflow-hidden",
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
