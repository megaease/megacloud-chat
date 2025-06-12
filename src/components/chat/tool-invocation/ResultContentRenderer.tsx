import { CopyButton } from "@/components/copy-button";
import { Markdown } from "@/components/markdown";
import type { ResultContent } from "@/types/tool-invocation";

export function renderResultContent(
	content: ResultContent | string,
	key: string,
) {
	// Function to try parsing JSON strings and display them with formatting
	const tryParseAndRenderJSON = (text: string, contentKey: string) => {
		try {
			// Try to parse the JSON string
			const parsed = JSON.parse(text);
			return (
				<div
					key={contentKey}
					className="relative rounded-lg border border-gray-200/60 dark:border-gray-700/60 overflow-hidden bg-gradient-to-br from-gray-50/80 to-white/60 dark:from-gray-900/60 dark:to-gray-800/40 shadow-lg"
				>
					<div className="bg-gradient-to-r from-gray-100/80 to-gray-200/60 dark:from-gray-800/60 dark:to-gray-700/40 px-4 py-2 border-b border-gray-200/60 dark:border-gray-700/60">
						<span className="text-sm font-bold text-gray-700 dark:text-gray-300">
							JSON
						</span>
					</div>
					<pre className="whitespace-pre-wrap break-words text-sm p-4 max-h-[300px] overflow-auto leading-relaxed font-mono">
						{JSON.stringify(parsed, null, 2)}
					</pre>
				</div>
			);
		} catch {
			// If not JSON, return null to use fallback rendering method
			return null;
		}
	};

	if (typeof content === "string") {
		// Try to parse as JSON
		const jsonResult = tryParseAndRenderJSON(content, key);
		if (jsonResult) return jsonResult;

		// Not JSON, render with Markdown
		return (
			<Markdown
				key={key}
				className="whitespace-pre-wrap my-0"
				content={content}
			/>
		);
	}

	switch (content.type) {
		case "text":
		case "markdown":
			try {
				const parsed = JSON.parse(content.text);
				return (
					<div
						key={key}
						className="relative rounded-lg border border-gray-200/60 dark:border-gray-700/60 overflow-hidden bg-gradient-to-br from-gray-50/80 to-white/60 dark:from-gray-900/60 dark:to-gray-800/40 shadow-lg"
					>
						<div className="bg-gradient-to-r from-gray-100/80 to-gray-200/60 dark:from-gray-800/60 dark:to-gray-700/40 px-4 py-2 border-b border-gray-200/60 dark:border-gray-700/60">
							<span className="text-sm font-bold text-gray-700 dark:text-gray-300">
								JSON
							</span>
						</div>
						<pre className="whitespace-pre-wrap break-words text-sm p-4 max-h-[300px] overflow-auto m-0 font-mono">
							{JSON.stringify(parsed, null, 2)}
						</pre>
					</div>
				);
			} catch {
				return (
					<Markdown
						key={key}
						className="whitespace-pre-wrap my-0"
						content={content.text}
					/>
				);
			}
		case "code":
			return (
				<div
					key={key}
					className="relative rounded-lg border border-slate-200/60 dark:border-slate-700/60 overflow-hidden bg-gradient-to-br from-slate-50/80 to-white/60 dark:from-slate-900/60 dark:to-gray-800/40 shadow-lg"
				>
					<div className="bg-gradient-to-r from-slate-100/80 to-slate-200/60 dark:from-slate-800/60 dark:to-slate-700/40 px-4 py-2 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
						<span className="text-sm font-bold text-slate-700 dark:text-slate-300">
							Code
						</span>
						<CopyButton text={content.text} />
					</div>
					<pre className="whitespace-pre-wrap break-words text-sm p-4 m-0 font-mono">
						<code className="font-mono">{content.text}</code>
					</pre>
				</div>
			);
		default:
			return null;
	}
}
