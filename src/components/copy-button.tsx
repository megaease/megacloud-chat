"use client";

import { useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export function CopyButton({
	text,
	className,
	variant = "ghost",
	size = "sm",
}: {
	text: string;
	className?: string;
	variant?:
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "ghost"
		| "link";
	size?: "default" | "sm" | "lg" | "icon";
}) {
	const [copied, setCopied] = useState<boolean>(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			// 使用更合适的延迟时间
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy text: ", err);
			// 可以添加错误状态处理
		}
	};

	return (
		<TooltipProvider delayDuration={300}>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						onClick={handleCopy}
						aria-label="Copy to clipboard"
						variant={variant}
						size={size}
						className={cn(
							"h-9 w-9 rounded-lg transition-all duration-200 hover:scale-105",
							"bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800",
							"border border-gray-200/60 border-solid dark:border-gray-700/60",
							"shadow-xs hover:shadow-sm",
							"text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200",
							copied &&
								"text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300",
							className,
						)}
					>
						{copied ? (
							<IconCheck className="h-4 w-4 animate-in fade-in-0 zoom-in-95" />
						) : (
							<IconCopy className="h-4 w-4 animate-in fade-in-0 zoom-in-95" />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent side="top">
					{copied ? "Copied!" : "Copy to clipboard"}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
