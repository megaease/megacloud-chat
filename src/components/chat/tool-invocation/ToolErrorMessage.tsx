import { motion } from "framer-motion";
import { IconAlertCircle } from "@tabler/icons-react";

interface ToolErrorMessageProps {
	errorMessage: string;
}

export function ToolErrorMessage({ errorMessage }: ToolErrorMessageProps) {
	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			className="p-5 border-b border-red-200/50 dark:border-red-800/50 bg-gradient-to-r from-red-50/80 to-red-100/50 dark:from-red-950/40 dark:to-red-950/60"
		>
			<div className="flex items-start gap-4">
				<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500 text-white shadow-lg flex-shrink-0 mt-0.5">
					<IconAlertCircle size={16} />
				</div>
				<div className="flex-1 min-w-0">
					<div className="font-bold text-base text-red-800 dark:text-red-200 mb-2">
						Execution Error
					</div>
					<div className="bg-white/60 dark:bg-red-950/30 rounded-lg p-3 border border-red-200/60 dark:border-red-800/40">
						<p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap break-words font-mono leading-relaxed">
							{errorMessage}
						</p>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
