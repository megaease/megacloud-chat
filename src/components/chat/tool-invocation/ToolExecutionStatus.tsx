import { motion } from "framer-motion";
import type { ToolStatus } from "./types";

interface ToolExecutionStatusProps {
	status: ToolStatus;
	toolName: string;
}

export function ToolExecutionStatus({
	status,
	toolName,
}: ToolExecutionStatusProps) {
	if (status !== "executing") return null;

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="px-5 pb-5"
		>
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-amber-100/80 to-orange-100/80 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200/60 dark:border-amber-800/40 shadow-lg"
			>
				{/* Modern spinner */}
				<div className="relative">
					<div className="w-6 h-6 rounded-full border-3 border-amber-200 dark:border-amber-700" />
					<div className="absolute top-0 left-0 w-6 h-6 rounded-full border-3 border-transparent border-t-amber-500 animate-spin" />
				</div>
				<div className="flex-1">
					<span className="text-base font-bold text-amber-800 dark:text-amber-200">
						Executing {toolName}
					</span>
					<p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
						Processing your request...
					</p>
				</div>
			</motion.div>
		</motion.div>
	);
}
