import { motion, AnimatePresence } from "framer-motion";
import { ToolErrorMessage } from "./ToolErrorMessage";
import { ToolParametersDisplay } from "./ToolParametersDisplay";
import { ToolResultDisplay } from "./ToolResultDisplay";
import type { ToolInvocationPart as ToolInvocationPartType } from "@/types/tool-invocation";
import type { ToolState, ToolStatus } from "./types";

interface ToolInvocationContentProps {
	toolState: ToolState;
	status: ToolStatus;
	isExpanded: boolean;
	part: ToolInvocationPartType;
}

export function ToolInvocationContent({
	toolState,
	status,
	isExpanded,
	part,
}: ToolInvocationContentProps) {
	if (status !== "success" && status !== "error") {
		return null;
	}

	return (
		<AnimatePresence>
			{isExpanded && (
				<motion.div
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: "auto", opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					transition={{ duration: 0.3, ease: "easeInOut" }}
					className="overflow-hidden"
				>
					<div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-b from-white/80 to-gray-50/50 dark:from-gray-900/40 dark:to-gray-900/80 backdrop-blur-sm rounded-b-lg">
						{/* Error Message */}
						{toolState.hasError && toolState.errorMessage && (
							<ToolErrorMessage errorMessage={toolState.errorMessage} />
						)}

						{/* Input Parameters */}
						<ToolParametersDisplay args={toolState.args} />

						{/* Execution Results */}
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1 }}
							className="p-5"
						>
							<div className="mb-4">
								<span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
									<div className="w-2 h-2 rounded-full bg-blue-500" />
									Execution Results
								</span>
							</div>
							<ToolResultDisplay
								toolInvocation={part.toolInvocation}
								toolName={toolState.toolName}
							/>
						</motion.div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
