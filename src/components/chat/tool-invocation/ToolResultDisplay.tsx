import { motion } from "framer-motion";
import { CopyButton } from "@/components/copy-button";
import { Markdown } from "@/components/markdown";
import type { ToolInvocationPart as ToolInvocationPartType } from "@/types/tool-invocation";
import { renderResultContent } from "./ResultContentRenderer";

interface ToolResultDisplayProps {
	toolInvocation: ToolInvocationPartType["toolInvocation"];
	toolName: string;
}

export function ToolResultDisplay({
	toolInvocation,
	toolName,
}: ToolResultDisplayProps) {
	if (toolInvocation.state !== "result" || !toolInvocation.result) {
		return null;
	}

	const { result } = toolInvocation;

	// If there's no content, display the complete result object
	if (!result.content) {
		return (
			<div className="rounded-lg border border-gray-200/60 dark:border-gray-700/60 overflow-hidden bg-gradient-to-br from-gray-50/80 to-white/60 dark:from-gray-900/60 dark:to-gray-800/40 shadow-lg">
				<div className="bg-gradient-to-r from-gray-100/80 to-gray-200/60 dark:from-gray-800/60 dark:to-gray-700/40 px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/60">
					<span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
						<div className="w-2 h-2 rounded-full bg-gray-500" />
						Raw Result
					</span>
				</div>
				<pre className="whitespace-pre-wrap break-words text-sm p-4 leading-relaxed font-mono">
					{JSON.stringify(result, null, 2)}
				</pre>
			</div>
		);
	}

	// Handle string content
	if (typeof result.content === "string") {
		try {
			const parsed = JSON.parse(result.content);
			return (
				<div className="rounded-lg border border-blue-200/60 dark:border-blue-700/60 overflow-hidden bg-gradient-to-br from-blue-50/80 to-white/60 dark:from-blue-900/60 dark:to-gray-800/40 shadow-lg">
					<div className="bg-gradient-to-r from-blue-100/80 to-blue-200/60 dark:from-blue-800/60 dark:to-blue-700/40 px-4 py-3 border-b border-blue-200/60 dark:border-blue-700/60 flex items-center justify-between">
						<span className="text-sm font-bold text-blue-800 dark:text-blue-200 flex items-center gap-2">
							<div className="w-2 h-2 rounded-full bg-blue-500" />
							JSON Result
						</span>
						<CopyButton text={result.content} />
					</div>
					<pre className="whitespace-pre-wrap break-words text-sm p-4 leading-relaxed font-mono">
						{JSON.stringify(parsed, null, 2)}
					</pre>
				</div>
			);
		} catch {
			return (
				<div className="rounded-lg border border-blue-200/60 dark:border-blue-700/60 overflow-hidden bg-gradient-to-br from-blue-50/80 to-white/60 dark:from-blue-900/60 dark:to-gray-800/40 shadow-lg">
					<div className="bg-gradient-to-r from-blue-100/80 to-blue-200/60 dark:from-blue-800/60 dark:to-blue-700/40 px-4 py-3 border-b border-blue-200/60 dark:border-blue-700/60 flex items-center justify-between">
						<span className="text-sm font-bold text-blue-800 dark:text-blue-200 flex items-center gap-2">
							<div className="w-2 h-2 rounded-full bg-blue-500" />
							Text Result
						</span>
						<CopyButton text={result.content} />
					</div>
					<div className="p-4">
						<Markdown
							content={result.content}
							className="text-sm leading-relaxed"
						/>
					</div>
				</div>
			);
		}
	}

	// Handle array content
	if (Array.isArray(result.content)) {
		if (result.content.length === 1) {
			const item = result.content[0];
			if (item) {
				const key = `${toolName}-result-single`;
				return renderResultContent(item, key);
			}
		}

		return (
			<div className="rounded-lg border border-purple-200/60 dark:border-purple-700/60 overflow-hidden bg-gradient-to-br from-purple-50/80 to-white/60 dark:from-purple-900/60 dark:to-gray-800/40 shadow-lg">
				<div className="bg-gradient-to-r from-purple-100/80 to-purple-200/60 dark:from-purple-800/60 dark:to-purple-700/40 px-4 py-3 border-b border-purple-200/60 dark:border-purple-700/60">
					<span className="text-sm font-bold text-purple-800 dark:text-purple-200 flex items-center gap-2">
						<div className="w-2 h-2 rounded-full bg-purple-500" />
						Results ({result.content.length})
					</span>
				</div>
				<div className="divide-y divide-gray-200/50 dark:divide-gray-700/50 max-h-[400px] overflow-y-auto">
					{result.content.map((item, index) => {
						const key = `${toolName}-result-${index}`;
						return (
							<div key={key} className="p-4">
								{renderResultContent(item, key)}
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	return null;
}
