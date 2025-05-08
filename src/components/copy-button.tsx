"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState<boolean>(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch (err) {
			console.error("Failed to copy text: ", err);
		}
	};

	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button onClick={handleCopy} aria-label="复制到剪贴板">
						{copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
					</Button>
				</TooltipTrigger>
				<TooltipContent className="px-2 py-1 text-xs">
					Click to copy
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
