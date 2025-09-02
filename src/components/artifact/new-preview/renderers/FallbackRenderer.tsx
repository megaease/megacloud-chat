"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, FileText } from "lucide-react";
import React from "react";

interface FallbackRendererProps {
	code: string;
	className?: string;
}

export function FallbackRenderer({
	code,
	className = "",
}: FallbackRendererProps) {
	return (
		<Card className={`h-full ${className}`}>
			<div className="p-6 border-b">
				<div className="flex items-center gap-2 text-muted-foreground">
					<FileText className="h-5 w-5" />
					<span className="font-medium">Code Viewer</span>
				</div>
				<div className="flex items-center gap-2 mt-2 text-sm text-orange-600">
					<AlertCircle className="h-4 w-4" />
					<span>No preview available for this file type</span>
				</div>
			</div>

			<ScrollArea className="h-[calc(100%-80px)]">
				<pre className="p-4 text-sm font-mono whitespace-pre-wrap bg-muted/30">
					{code}
				</pre>
			</ScrollArea>
		</Card>
	);
}
