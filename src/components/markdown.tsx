"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

interface MarkdownProps {
	content: string;
	className?: string;
}
const components: Partial<Components> = {
	h1: ({ className, children, ...props }) => (
		<h1
			className={cn(
				"text-xl font-bold text-foreground mt-4 mb-1 border-b pb-1",
				className,
			)}
			{...props}
		>
			{children}
		</h1>
	),
	h2: ({ className, children, ...props }) => (
		<h2
			className={cn("text-lg font-bold text-foreground mt-4 mb-1", className)}
			{...props}
		>
			{children}
		</h2>
	),
	h3: ({ className, children, ...props }) => (
		<h3
			className={cn(
				"text-base font-semibold text-foreground mt-3 mb-1",
				className,
			)}
			{...props}
		>
			{children}
		</h3>
	),
	h4: ({ className, children, ...props }) => (
		<h4
			className={cn(
				"text-sm font-semibold text-foreground mt-2 mb-1",
				className,
			)}
			{...props}
		>
			{children}
		</h4>
	),
	p: ({ className, children, ...props }) => (
		<p className={cn("leading-6", className)} {...props}>
			{children}
		</p>
	),
	a: ({ className, children, ...props }) => (
		<a
			className={cn("text-primary hover:underline inline-block", className)}
			target="_blank"
			rel="noopener noreferrer"
			{...props}
		>
			{children}
		</a>
	),
	ul: ({ className, children, ...props }) => (
		<ul
			className={cn(
				"list-disc marker:text-muted-foreground pl-6 my-0 space-y-0",
				className,
			)}
			{...props}
		>
			{children}
		</ul>
	),
	ol: ({ className, children, ...props }) => (
		<ol
			className={cn(
				"list-decimal marker:text-muted-foreground pl-6 my-0 space-y-0",
				className,
			)}
			{...props}
		>
			{children}
		</ol>
	),
	li: ({ className, children, ...props }) => (
		<li
			className={cn(
				"my-0 py-0 pl-1 leading-normal marker:text-muted-foreground",
				className,
			)}
			{...props}
		>
			{children}
		</li>
	),
	blockquote: ({ className, children, ...props }) => (
		<blockquote
			className={cn(
				"border-l-3 border-primary/30 pl-3 py-0.5 my-2 text-muted-foreground italic",
				className,
			)}
			{...props}
		>
			{children}
		</blockquote>
	),
	hr: ({ className, ...props }) => (
		<hr className={cn("my-3 border-border", className)} {...props} />
	),
	table: ({ className, children, ...props }) => (
		<div className="overflow-x-auto my-2 rounded-[var(--radius)] border border-border">
			<table
				className={cn("w-full border-collapse text-sm", className)}
				{...props}
			>
				{children}
			</table>
		</div>
	),
	thead: ({ className, children, ...props }) => (
		<thead className={cn("bg-muted/50", className)} {...props}>
			{children}
		</thead>
	),
	tbody: ({ className, children, ...props }) => (
		<tbody className={cn("divide-y divide-border", className)} {...props}>
			{children}
		</tbody>
	),
	tr: ({ className, children, ...props }) => (
		<tr className={cn("divide-x divide-border", className)} {...props}>
			{children}
		</tr>
	),
	th: ({ className, children, ...props }) => (
		<th
			className={cn(
				"px-3 py-1.5 text-left font-medium text-foreground",
				className,
			)}
			{...props}
		>
			{children}
		</th>
	),
	td: ({ className, children, ...props }) => (
		<td className={cn("px-3 py-1.5 text-foreground", className)} {...props}>
			{children}
		</td>
	),

	strong: ({ className, children, ...props }) => (
		<strong
			className={cn("font-semibold text-foreground", className)}
			{...props}
		>
			{children}
		</strong>
	),
	em: ({ className, children, ...props }) => (
		<em className={cn("italic text-foreground", className)} {...props}>
			{children}
		</em>
	),
	code: ({ className, children, ...props }) => {
		const match = /language-(\w+)/.exec(className || "");

		if (match) {
			const codeContent = String(children).replace(/\n$/, "");
			return (
				<div className="relative my-2 rounded-[var(--radius)] border border-border overflow-hidden">
					<div className="flex items-center justify-between bg-muted/50 px-3 py-1 border-b border-border">
						<span className="text-xs font-medium">{match[1]}</span>

						<CopyButton text={codeContent} />
					</div>
					<div className="overflow-x-auto">
						<pre className="p-3 bg-none text-sm">
							<code className="font-mono whitespace-pre-wrap break-all">
								{codeContent}
							</code>
						</pre>
					</div>
				</div>
			);
		}

		return (
			<code
				className={cn(
					"relative rounded-[calc(var(--radius)/2)] bg-muted px-1 py-0.5 font-mono text-xs border border-border",
					className,
				)}
				{...props}
			>
				{children}
			</code>
		);
	},
};
export function Markdown({ content, className }: MarkdownProps) {
	// Handle empty content
	if (!content || content.trim() === "") {
		return null;
	}

	return (
		<div className={cn("markdown text-sm leading-normal", className)}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={components}
				skipHtml // Skip HTML tag processing
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
