"use client";

import { Card } from "@/components/ui/card";
import React from "react";

interface MarkdownPreviewRendererProps {
	code: string;
	className?: string;
}

export function MarkdownPreviewRenderer({
	code,
	className = "",
}: MarkdownPreviewRendererProps) {
	// Simple markdown renderer (in a real implementation, you'd use a proper markdown library)
	const renderMarkdown = (markdown: string) => {
		// Basic markdown to HTML conversion
		const html = markdown
			// Headers
			.replace(/^### (.*$)/gim, "<h3>$1</h3>")
			.replace(/^## (.*$)/gim, "<h2>$1</h2>")
			.replace(/^# (.*$)/gim, "<h1>$1</h1>")
			// Bold
			.replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
			// Italic
			.replace(/\*(.*)\*/gim, "<em>$1</em>")
			// Code blocks
			.replace(/```(\w+)?\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
			// Inline code
			.replace(/`([^`]+)`/g, "<code>$1</code>")
			// Links
			.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
			// Line breaks
			.replace(/\n/g, "<br>");

		return { __html: html };
	};

	// Simple markdown renderer without dangerouslySetInnerHTML
	const renderMarkdownLines = (markdown: string) => {
		const lines = markdown.split("\n");

		return lines.map((line, index) => {
			let content = line;
			let element: React.ElementType = "div";
			let className = "";

			// Headers
			if (line.startsWith("### ")) {
				element = "h3";
				content = line.substring(4);
				className = "text-lg font-semibold mb-2";
			} else if (line.startsWith("## ")) {
				element = "h2";
				content = line.substring(3);
				className = "text-xl font-semibold mb-3";
			} else if (line.startsWith("# ")) {
				element = "h1";
				content = line.substring(2);
				className = "text-2xl font-bold mb-4";
			}

			// Process inline formatting
			const parts: React.ReactNode[] = [];
			let lastIndex = 0;

			// Bold text
			const boldRegex = /\*\*(.*?)\*\*/g;
			let match: RegExpExecArray | null;
			let remainingText = content;

			match = boldRegex.exec(content);
			while (match !== null) {
				// Add text before the bold part
				if (match.index > lastIndex) {
					parts.push(remainingText.substring(0, match.index - lastIndex));
				}

				// Add the bold part
				parts.push(
					<strong
						key={`bold-${index}-${match.index}`}
						className="font-semibold"
					>
						{match[1]}
					</strong>,
				);

				lastIndex = match.index + match[0].length;
				remainingText = content.substring(lastIndex);
			}

			// Add remaining text
			if (remainingText) {
				parts.push(remainingText);
			}

			// If no formatting found, just use the content
			if (parts.length === 0) {
				parts.push(content);
			}

			return React.createElement(
				element,
				{
					key: index,
					className: className || (element === "div" ? "mb-1" : ""),
				},
				...parts,
			);
		});
	};

	return (
		<Card className={`p-4 h-full overflow-auto ${className}`}>
			<div className="prose prose-sm max-w-none">
				{renderMarkdownLines(code)}
			</div>
		</Card>
	);
}
