"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Code,
	Eye,
	Monitor,
	Smartphone,
	SplitSquareVertical,
	Tablet,
} from "lucide-react";
import React from "react";

interface ViewModeSelectorProps {
	viewMode: "code" | "preview" | "split";
	previewSize?: "desktop" | "tablet" | "mobile";
	onViewModeChange: (mode: "code" | "preview" | "split") => void;
	onPreviewSizeChange?: (size: "desktop" | "tablet" | "mobile") => void;
	canSplit?: boolean;
	canResize?: boolean;
	className?: string;
}

export function ViewModeSelector({
	viewMode,
	previewSize = "desktop",
	onViewModeChange,
	onPreviewSizeChange,
	canSplit = true,
	canResize = true,
	className = "",
}: ViewModeSelectorProps) {
	const viewModes = [
		{
			id: "code" as const,
			label: "Code",
			icon: Code,
			description: "View code only",
		},
		{
			id: "preview" as const,
			label: "Preview",
			icon: Eye,
			description: "View preview only",
		},
		{
			id: "split" as const,
			label: "Split",
			icon: SplitSquareVertical,
			description: "View code and preview side by side",
			disabled: !canSplit,
		},
	];

	const previewSizes = [
		{
			id: "desktop" as const,
			label: "Desktop",
			icon: Monitor,
			description: "Desktop view",
		},
		{
			id: "tablet" as const,
			label: "Tablet",
			icon: Tablet,
			description: "Tablet view",
		},
		{
			id: "mobile" as const,
			label: "Mobile",
			icon: Smartphone,
			description: "Mobile view",
		},
	];

	return (
		<div className={`space-y-2 ${className}`}>
			{/* View Mode Selection */}
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium text-muted-foreground">
					View Mode
				</span>
				{canResize && viewMode !== "code" && (
					<Badge variant="outline" className="text-xs capitalize">
						{previewSize}
					</Badge>
				)}
			</div>

			<div className="flex gap-1">
				{viewModes.map((mode) => (
					<Button
						key={mode.id}
						variant={viewMode === mode.id ? "default" : "outline"}
						size="sm"
						onClick={() => onViewModeChange(mode.id)}
						disabled={mode.disabled}
						className="flex-1 h-8"
						title={mode.description}
					>
						<mode.icon className="h-4 w-4 mr-1" />
						{mode.label}
					</Button>
				))}
			</div>

			{/* Preview Size Selection (only shown when preview is visible) */}
			{canResize && viewMode !== "code" && (
				<div className="space-y-2">
					<span className="text-sm font-medium text-muted-foreground">
						Preview Size
					</span>
					<div className="flex gap-1">
						{previewSizes.map((size) => (
							<Button
								key={size.id}
								variant={previewSize === size.id ? "default" : "outline"}
								size="sm"
								onClick={() => onPreviewSizeChange?.(size.id)}
								className="flex-1 h-8"
								title={size.description}
							>
								<size.icon className="h-4 w-4 mr-1" />
								{size.label}
							</Button>
						))}
					</div>
				</div>
			)}

			{/* Quick Info */}
			<div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded-md">
				{viewMode === "code" && (
					<p>Code view - Edit and view your source code</p>
				)}
				{viewMode === "preview" && (
					<p>Preview view - See the rendered output ({previewSize} view)</p>
				)}
				{viewMode === "split" && (
					<p>
						Split view - Code and preview side by side ({previewSize} preview)
					</p>
				)}
			</div>
		</div>
	);
}

// Compact version for use in toolbars or tight spaces
interface CompactViewModeSelectorProps {
	viewMode: "code" | "preview" | "split";
	onViewModeChange: (mode: "code" | "preview" | "split") => void;
	canSplit?: boolean;
	className?: string;
}

export function CompactViewModeSelector({
	viewMode,
	onViewModeChange,
	canSplit = true,
	className = "",
}: CompactViewModeSelectorProps) {
	const modes = [
		{ id: "code" as const, icon: Code, tooltip: "Code View" },
		{ id: "preview" as const, icon: Eye, tooltip: "Preview View" },
		{
			id: "split" as const,
			icon: SplitSquareVertical,
			tooltip: "Split View",
			disabled: !canSplit,
		},
	];

	return (
		<div className={`flex gap-1 ${className}`}>
			{modes.map((mode) => (
				<Button
					key={mode.id}
					variant={viewMode === mode.id ? "default" : "ghost"}
					size="sm"
					onClick={() => onViewModeChange(mode.id)}
					disabled={mode.disabled}
					className="h-8 w-8 p-0"
					title={mode.tooltip}
				>
					<mode.icon className="h-4 w-4" />
				</Button>
			))}
		</div>
	);
}

// Preview size selector as standalone component
interface PreviewSizeSelectorProps {
	size: "desktop" | "tablet" | "mobile";
	onSizeChange: (size: "desktop" | "tablet" | "mobile") => void;
	orientation?: "horizontal" | "vertical";
	className?: string;
}

export function PreviewSizeSelector({
	size,
	onSizeChange,
	orientation = "horizontal",
	className = "",
}: PreviewSizeSelectorProps) {
	const sizes = [
		{ id: "desktop" as const, icon: Monitor, label: "Desktop" },
		{ id: "tablet" as const, icon: Tablet, label: "Tablet" },
		{ id: "mobile" as const, icon: Smartphone, label: "Mobile" },
	];

	const isVertical = orientation === "vertical";

	return (
		<div
			className={`flex ${
				isVertical ? "flex-col" : "flex-row"
			} gap-1 ${className}`}
		>
			{sizes.map((previewSize) => (
				<Button
					key={previewSize.id}
					variant={size === previewSize.id ? "default" : "outline"}
					size="sm"
					onClick={() => onSizeChange(previewSize.id)}
					className={isVertical ? "justify-start h-8 w-full" : "h-8 px-3"}
					title={`${previewSize.label} preview`}
				>
					<previewSize.icon className="h-4 w-4 mr-1" />
					{previewSize.label}
				</Button>
			))}
		</div>
	);
}
