"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Code,
	Copy,
	Download,
	ExternalLink,
	Eye,
	Maximize2,
	Minimize2,
	Play,
	RefreshCw,
	Settings,
} from "lucide-react";
import React from "react";

interface PreviewToolbarProps {
	viewMode: "code" | "preview";
	language: string;
	isExecuting?: boolean;
	canExecute?: boolean;
	canPreview?: boolean;
	onToggleViewMode: () => void;
	onExecute?: () => void;
	onCopy?: () => void;
	onDownload?: () => void;
	onRefresh?: () => void;
	onOpenInNewTab?: () => void;
	onSettings?: () => void;
	onFullscreen?: () => void;
	className?: string;
}

export function PreviewToolbar({
	viewMode,
	language,
	isExecuting = false,
	canExecute = false,
	canPreview = true,
	onToggleViewMode,
	onExecute,
	onCopy,
	onDownload,
	onRefresh,
	onOpenInNewTab,
	onSettings,
	onFullscreen,
	className = "",
}: PreviewToolbarProps) {
	return (
		<div
			className={`flex items-center justify-between p-2 border-b bg-muted/30 ${className}`}
		>
			{/* Left side - Language and View Mode */}
			<div className="flex items-center gap-2">
				<Badge variant="outline" className="capitalize text-xs">
					{language}
				</Badge>

				{canPreview && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onToggleViewMode}
						className="h-8 px-2"
					>
						{viewMode === "code" ? (
							<>
								<Eye className="h-4 w-4 mr-1" />
								Preview
							</>
						) : (
							<>
								<Code className="h-4 w-4 mr-1" />
								Code
							</>
						)}
					</Button>
				)}
			</div>

			{/* Right side - Actions */}
			<div className="flex items-center gap-1">
				{/* Execute button */}
				{canExecute && onExecute && (
					<Button
						variant="outline"
						size="sm"
						onClick={onExecute}
						disabled={isExecuting}
						className="h-8 px-2"
					>
						{isExecuting ? (
							<>
								<div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
								Running
							</>
						) : (
							<>
								<Play className="h-4 w-4 mr-1" />
								Run
							</>
						)}
					</Button>
				)}

				<Separator orientation="vertical" className="h-6 mx-1" />

				{/* Copy button */}
				{onCopy && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onCopy}
						className="h-8 w-8 p-0"
						title="Copy code"
					>
						<Copy className="h-4 w-4" />
					</Button>
				)}

				{/* Download button */}
				{onDownload && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onDownload}
						className="h-8 w-8 p-0"
						title="Download code"
					>
						<Download className="h-4 w-4" />
					</Button>
				)}

				{/* Refresh button (for preview mode) */}
				{viewMode === "preview" && onRefresh && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onRefresh}
						disabled={isExecuting}
						className="h-8 w-8 p-0"
						title="Refresh preview"
					>
						<RefreshCw className="h-4 w-4" />
					</Button>
				)}

				{/* Open in new tab button (for preview mode) */}
				{viewMode === "preview" && onOpenInNewTab && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onOpenInNewTab}
						className="h-8 w-8 p-0"
						title="Open in new tab"
					>
						<ExternalLink className="h-4 w-4" />
					</Button>
				)}

				{/* Settings button */}
				{onSettings && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onSettings}
						className="h-8 w-8 p-0"
						title="Settings"
					>
						<Settings className="h-4 w-4" />
					</Button>
				)}

				{/* Fullscreen button */}
				{onFullscreen && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onFullscreen}
						className="h-8 w-8 p-0"
						title="Toggle fullscreen"
					>
						<Maximize2 className="h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	);
}
