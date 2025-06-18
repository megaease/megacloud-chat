"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
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
	size = "sm",
	showText = false,
	textLabel,
}: {
	text: string;
	className?: string;
	size?: "default" | "sm" | "lg" | "icon";
	showText?: boolean;
	textLabel?: string;
}) {
	const t = useTranslations('Common');
	const [copied, setCopied] = useState<boolean>(false);
	const defaultTextLabel = textLabel || t('copy');

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			// 使用更合适的延迟时间，并添加成功动画
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
						variant="ghost"
						size={size}
						className={cn(
							showText ? "h-8 px-3 gap-2" : "h-8 w-8",
							"hover:text-current",
							copied && "text-green-600 hover:text-green-700",
							className,
						)}
					>
						{copied ? (
							<>
								<IconCheck className={showText ? "h-3 w-3" : "h-4 w-4"} />
								{showText && <span className="text-xs">{t('copied')}</span>}
							</>
						) : (
							<>
								<IconCopy className={showText ? "h-3 w-3" : "h-4 w-4"} />
								{showText && <span className="text-xs">{defaultTextLabel}</span>}
							</>
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent side="top">
					{copied ? t('copied') : t('copy')}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
