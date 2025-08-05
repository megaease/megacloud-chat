// components/QuickAccessSection.tsx
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { IconWorld, IconCpu, IconBolt } from "@tabler/icons-react";
import type { ApiProvider } from "@/types/api-provider";
import { CommandMenuKbd, EnterKeyIcon } from "./shared";

interface QuickAccessSectionProps {
	currentProvider: ApiProvider | null;
	onProviderFilter: () => void;
	onModelFilter: () => void;
	onTipsFilter: () => void;
}

export function QuickAccessSection({
	currentProvider,
	onProviderFilter,
	onModelFilter,
	onTipsFilter,
}: QuickAccessSectionProps) {
	return (
		<CommandGroup heading="✨ Quick Access">
			<CommandItem
				value="quick-browse-show-all-providers-provider"
				onSelect={onProviderFilter}
				className="group/item relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer hover:bg-white/70 dark:hover:bg-white/10 border border-transparent hover:border-gray-200/60 dark:hover:border-white/15 backdrop-blur-sm"
			>
				{/* 悬浮背景渐变 */}
				<div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 via-purple-500/6 to-pink-500/8 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 rounded-xl" />

				<div className="relative z-10 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
					<IconWorld className="h-5 w-5 text-white" />
				</div>
				<div className="relative z-10 flex flex-col flex-1">
					<span className="font-semibold text-sm">Show All Providers</span>
					<span className="text-xs text-muted-foreground">
						Type "provider:" to filter providers
					</span>
				</div>
				<div className="relative z-10 flex items-center gap-1">
					<kbd className="hidden sm:inline-flex h-6 w-6 select-none items-center justify-center rounded-md border border-gray-200/60 border-solid dark:border-white/20 bg-gray-50/80 dark:bg-white/[0.06] font-mono text-xs font-medium text-muted-foreground pointer-events-none">
						P
					</kbd>
					<CommandMenuKbd
						className="opacity-0 group-aria-selected/item:opacity-100 transition-opacity"
						aria-label="Press Enter to select"
					>
						<EnterKeyIcon />
					</CommandMenuKbd>
				</div>
			</CommandItem>

			{currentProvider?.availableModels?.length ? (
				<CommandItem
					value="quick-browse-show-all-models-model"
					onSelect={onModelFilter}
					className="group/item relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer hover:bg-white/70 dark:hover:bg-white/10 border border-transparent hover:border-gray-200/60 dark:hover:border-white/15 backdrop-blur-sm"
				>
					{/* 悬浮背景渐变 */}
					<div className="absolute inset-0 bg-gradient-to-r from-purple-500/8 via-pink-500/6 to-blue-500/8 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 rounded-xl" />

					<div className="relative z-10 w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
						<IconCpu className="h-5 w-5 text-white" />
					</div>
					<div className="relative z-10 flex flex-col flex-1">
						<span className="font-semibold text-sm">Show All Models</span>
						<span className="text-xs text-muted-foreground">
							Type "model:" to filter models
						</span>
					</div>
					<div className="relative z-10 flex items-center gap-1">
						<kbd className="hidden sm:inline-flex h-6 w-6 select-none items-center justify-center rounded-md border border-gray-200/60 border-solid dark:border-white/20 bg-gray-50/80 dark:bg-white/[0.06] font-mono text-xs font-medium text-muted-foreground pointer-events-none">
							M
						</kbd>
						<CommandMenuKbd
							className="opacity-0 group-aria-selected/item:opacity-100 transition-opacity"
							aria-label="Press Enter to select"
						>
							<EnterKeyIcon />
						</CommandMenuKbd>
					</div>
				</CommandItem>
			) : null}

			<CommandItem
				value="quick-show-tips-tips"
				onSelect={onTipsFilter}
				className="group/item relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer hover:bg-white/70 dark:hover:bg-white/10 border border-transparent hover:border-gray-200/60 dark:hover:border-white/15 backdrop-blur-sm"
			>
				{/* 悬浮背景渐变 */}
				<div className="absolute inset-0 bg-gradient-to-r from-orange-500/8 via-yellow-500/6 to-red-500/8 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 rounded-xl" />

				<div className="relative z-10 w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
					<IconBolt className="h-5 w-5 text-white" />
				</div>
				<div className="relative z-10 flex flex-col flex-1">
					<span className="font-semibold text-sm">Show Quick Tips</span>
					<span className="text-xs text-muted-foreground">
						Type "tips:" to see helpful usage tips
					</span>
				</div>
				<div className="relative z-10 flex items-center gap-1">
					<kbd className="hidden sm:inline-flex h-6 w-6 select-none items-center justify-center rounded-md border border-gray-200/60 border-solid dark:border-white/20 bg-gray-50/80 dark:bg-white/[0.06] font-mono text-xs font-medium text-muted-foreground pointer-events-none">
						T
					</kbd>
					<CommandMenuKbd
						className="opacity-0 group-aria-selected/item:opacity-100 transition-opacity"
						aria-label="Press Enter to select"
					>
						<EnterKeyIcon />
					</CommandMenuKbd>
				</div>
			</CommandItem>
		</CommandGroup>
	);
}
