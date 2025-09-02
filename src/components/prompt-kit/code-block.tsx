"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { codeToHtml } from "shiki";

export type CodeBlockProps = {
	children?: React.ReactNode;
	className?: string;
} & React.HTMLProps<HTMLDivElement>;

function CodeBlock({ children, className, ...props }: CodeBlockProps) {
	return (
		<div
			className={cn(
				"not-prose flex w-full flex-col overflow-clip border",
				"border-border bg-card text-card-foreground rounded-xl",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export type CodeBlockCodeProps = {
	code: string;
	language?: string;
	theme?: string;
	className?: string;
} & React.HTMLProps<HTMLDivElement>;

function CodeBlockCode({
	code,
	language = "tsx",
	theme = "github-light",
	className,
	...props
}: CodeBlockCodeProps) {
	const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		async function highlight() {
			if (!code) {
				setHighlightedHtml("<pre><code></code></pre>");
				return;
			}

			const html = await codeToHtml(code, { lang: language, theme });
			setHighlightedHtml(html);
		}
		highlight();
	}, [code, language, theme]);

	const classNames = cn(
		"w-full overflow-x-auto text-[13px] [&>pre]:px-4 [&>pre]:py-4 max-h-[400px] overflow-y-auto",
		className,
	);

	useEffect(() => {
		if (!containerRef.current || !highlightedHtml) return;
		containerRef.current.innerHTML = highlightedHtml;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [highlightedHtml]);

	return (
		<div className={classNames} {...props} ref={containerRef}>
			{!highlightedHtml && (
				<pre>
					<code>{code}</code>
				</pre>
			)}
		</div>
	);
}

export type CodeBlockGroupProps = React.HTMLAttributes<HTMLDivElement>;

function CodeBlockGroup({
	children,
	className,
	...props
}: CodeBlockGroupProps) {
	return (
		<div
			className={cn("flex items-center justify-between", className)}
			{...props}
		>
			{children}
		</div>
	);
}

export { CodeBlockGroup, CodeBlockCode, CodeBlock };
