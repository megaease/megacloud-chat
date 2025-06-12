import { motion } from "framer-motion";

interface ToolParametersDisplayProps {
	args: Record<string, unknown>;
}

export function ToolParametersDisplay({ args }: ToolParametersDisplayProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="p-5 border-b border-gray-200/50 dark:border-gray-700/50"
		>
			<div className="mb-4">
				<span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
					<div className="w-2 h-2 rounded-full bg-blue-500" />
					Input Parameters
				</span>
			</div>
			<div className="rounded-lg border border-gray-200/60 dark:border-gray-700/60 overflow-hidden bg-gradient-to-br from-gray-50/80 to-white/60 dark:from-gray-900/60 dark:to-gray-800/40 shadow-lg">
				<div className="bg-gradient-to-r from-gray-100/80 to-gray-200/60 dark:from-gray-800/60 dark:to-gray-700/40 px-4 py-2 border-b border-gray-200/60 dark:border-gray-700/60">
					<span className="text-xs font-bold text-gray-600 dark:text-gray-400">
						JSON
					</span>
				</div>
				<pre className="whitespace-pre-wrap break-words text-sm p-4 leading-relaxed font-mono">
					{JSON.stringify(args, null, 2)}
				</pre>
			</div>
		</motion.div>
	);
}
