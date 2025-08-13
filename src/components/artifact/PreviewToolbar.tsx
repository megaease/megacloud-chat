// components/artifact/PreviewToolbar.tsx
"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Copy, Download, RefreshCw } from "lucide-react";
import { useState } from "react";

interface PreviewToolbarProps {
	content: string;
	filename?: string;
	mimeType?: string;
	onRefresh?: () => void;
	refreshing?: boolean;
	className?: string;
	children?: React.ReactNode;
}

export function PreviewToolbar({
	content,
	filename = "file.txt",
	mimeType = "text/plain",
	onRefresh,
	refreshing = false,
	className,
	children,
}: PreviewToolbarProps) {
	const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(content);
			setCopyStatus("copied");
			setTimeout(() => setCopyStatus("idle"), 2000);
		} catch (error) {
			console.error("Copy failed:", error);
		}
	};

	const handleDownload = () => {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	return (
		<div
			className={cn(
				"flex items-center justify-between px-3 py-1.5 border-b bg-muted/20 flex-shrink-0 min-h-[36px]",
				className,
			)}
		>
			{/* 左侧：自定义内容 */}
			<div className="flex items-center gap-2 min-w-0 flex-1">{children}</div>

			{/* 右侧：工具按钮 */}
			<div className="flex items-center gap-1 flex-shrink-0">
				{/* 刷新按钮 */}
				{onRefresh && (
					<Button
						onClick={onRefresh}
						size="sm"
						variant="ghost"
						className="h-6 w-6 p-0"
						disabled={refreshing}
					>
						<RefreshCw
							className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
						/>
					</Button>
				)}

				{/* 复制和下载按钮组 */}
				<div className="flex items-center rounded-md overflow-hidden bg-background border">
					{/* 复制按钮 */}
					<Button
						variant="ghost"
						size="sm"
						onClick={handleCopy}
						disabled={!content}
						className={cn(
							"h-6 w-6 p-0 rounded-none border-0",
							copyStatus === "copied"
								? "text-green-600 bg-green-50 hover:bg-green-100"
								: "hover:bg-muted",
						)}
					>
						{copyStatus === "copied" ? (
							<Check className="h-3 w-3" />
						) : (
							<Copy className="h-3 w-3" />
						)}
					</Button>

					{/* 分隔线 */}
					<div className="w-px h-4 bg-border" />

					{/* 下载按钮 */}
					<Button
						variant="ghost"
						size="sm"
						onClick={handleDownload}
						disabled={!content}
						className="h-6 w-6 p-0 rounded-none border-0 hover:bg-muted"
					>
						<Download className="h-3 w-3" />
					</Button>
				</div>
			</div>
		</div>
	);
}
