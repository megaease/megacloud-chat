"use client";

import React, { useRef } from "react";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ArrowDown } from "lucide-react";

interface AutoScrollProps {
	children: React.ReactNode;
	className?: string;
	enabled?: boolean;
	scrollBehavior?: ScrollBehavior;
	endElement?: React.ReactNode;
	showScrollButton?: boolean;
	scrollButtonClassName?: string;
	scrollButtonPosition?: "inside" | "outside";
	scrollButtonIcon?: React.ReactNode;
	scrollButtonLabel?: string;
	scrollButtonVariant?:
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "ghost"
		| "link";
}

export function AutoScroll({
	children,
	className,
	enabled = true,
	scrollBehavior = "smooth",
	endElement,
	showScrollButton = true,
	scrollButtonClassName,
	scrollButtonPosition = "inside",
	scrollButtonIcon = <ArrowDown className="h-4 w-4" />,
	scrollButtonLabel,
	scrollButtonVariant = "secondary",
}: AutoScrollProps) {
	// Create a reference that's definitely not null
	const containerRef = useRef<HTMLDivElement>(null);

	// Use hook to manage scrolling
	const { hasScrolledUp, scrollToBottom } = useScrollToBottom({
		behavior: scrollBehavior,
		scrollOnMount: enabled,
		scrollOnContentChange: enabled,
		adaptRadixScrollArea: true,
	});

	return (
		<div className="relative w-full h-full">
			<div ref={containerRef} className={className}>
				{children}
				{endElement && (
					<div className="py-8 text-center text-xs text-muted-foreground">
						{endElement}
					</div>
				)}
				<div className="h-0" />
			</div>

			{showScrollButton && hasScrolledUp && (
				<div
					className={cn(
						"absolute",
						scrollButtonPosition === "inside"
							? "right-4 bottom-4"
							: "-right-12 bottom-4",
						scrollButtonClassName,
					)}
				>
					<Button
						size={scrollButtonLabel ? "default" : "icon"}
						variant={scrollButtonVariant}
						className={cn(
							"shadow-md",
							scrollButtonLabel ? "rounded-full px-3" : "rounded-full",
						)}
						onClick={scrollToBottom}
					>
						{scrollButtonIcon}
						{scrollButtonLabel && (
							<span className="ml-2">{scrollButtonLabel}</span>
						)}
					</Button>
				</div>
			)}
		</div>
	);
}
