import { motion } from "framer-motion";
import { IconChevronDown, IconExternalLink } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ToolIcon } from "./ToolIcon";
import { StatusBadge } from "./StatusBadge";
import type { ToolState, ToolStatus, ToolTheme } from "./types";

interface ToolInvocationHeaderProps {
	toolState: ToolState;
	status: ToolStatus;
	theme: ToolTheme;
	isExpanded: boolean;
	hasExpandableContent: boolean;
	onToggleExpanded: () => void;
	onOpenArtifact?: () => void;
}

export function ToolInvocationHeader({
	toolState,
	status,
	theme,
	isExpanded,
	hasExpandableContent,
	onToggleExpanded,
	onOpenArtifact,
}: ToolInvocationHeaderProps) {
	const getStatusDescription = () => {
		switch (status) {
			case "error":
				return "Tool execution failed";
			case "success":
				return "Tool executed successfully";
			case "executing":
				return "Tool is currently executing";
			default:
				return "Tool is ready";
		}
	};

	return (
		<div
			className={cn(
				"flex items-center gap-4 px-4 py-2 cursor-pointer backdrop-blur-sm transition-all duration-300 relative",
				// 动态圆角：如果没有展开内容，使用完整圆角；如果有展开内容，只使用顶部圆角
				hasExpandableContent ? "rounded-t-lg" : "rounded-lg",
				"before:absolute before:inset-0 before:bg-white/40 before:dark:bg-gray-800/40 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100",
				// 对应的 before 伪元素圆角
				hasExpandableContent ? "before:rounded-t-lg" : "before:rounded-lg",
				theme.hoverBackgroundColor,
			)}
			onClick={onToggleExpanded}
		>
			<div className="flex items-center gap-4 flex-1 relative z-10">
				{/* Tool Icon */}
				<ToolIcon toolName={toolState.toolName} theme={theme} />

				<div className="flex flex-col min-w-0 flex-1">
					<div className="flex items-center gap-3 mb-1">
						<h3
							className={cn(
								"font-bold text-base truncate tracking-tight",
								theme.textColor,
							)}
						>
							{toolState.toolName}
						</h3>
						{/* Status Badge */}
						{/* <StatusBadge status={status} theme={theme} /> */}
					</div>

					{/* Status Description */}
					<p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
						{getStatusDescription()}
					</p>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex items-center gap-3 relative z-10">
				{/* Artifact Button */}
				{toolState.isDocumentTool &&
					toolState.isSuccessful &&
					onOpenArtifact && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									onClick={(e) => {
										e.stopPropagation();
										onOpenArtifact();
									}}
									variant="secondary"
									size="sm"
									className="h-9 px-4 text-sm font-semibold bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
								>
									<IconExternalLink className="h-4 w-4 mr-2" />
									查看 Artifact
								</Button>
							</TooltipTrigger>
							<TooltipContent>Open in Artifact viewer</TooltipContent>
						</Tooltip>
					)}

				{/* Expand/Collapse Button */}
				{status === "success" && (
					<motion.button
						type="button"
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.95 }}
						className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 shadow-xs transition-all duration-200"
					>
						<motion.div
							animate={{ rotate: isExpanded ? 180 : 0 }}
							transition={{ duration: 0.3, ease: "easeInOut" }}
						>
							<IconChevronDown
								size={16}
								className="text-gray-600 dark:text-gray-400"
							/>
						</motion.div>
					</motion.button>
				)}
			</div>
		</div>
	);
}
