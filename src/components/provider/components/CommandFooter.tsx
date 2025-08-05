// components/CommandFooter.tsx
import type { ApiProvider } from "@/types/api-provider";
import { CommandMenuKbd } from "./shared";

interface CommandFooterProps {
	searchValue: string;
	searchResultsCount: number;
	providers: ApiProvider[];
	currentProvider: ApiProvider | null;
}

export function CommandFooter({
	searchValue,
	searchResultsCount,
	providers,
	currentProvider,
}: CommandFooterProps) {
	return (
		<div
			className="absolute inset-x-0 bottom-0 z-20 flex h-10 items-center justify-between rounded-b-xl border-t border-gray-200/60 border-solid dark:border-white/10 bg-white/80 dark:bg-black/40 backdrop-blur-xl px-4 text-xs font-medium"
			role="status"
			aria-label="Command palette status and shortcuts"
		>
			{/* Left side - Search status or basic info */}
			<div
				className="flex items-center gap-2 min-w-0 flex-1 text-muted-foreground"
				aria-live="polite"
			>
				{searchValue?.trim() ? (
					<>
						<span className="text-[10px]" aria-hidden="true">
							🔍
						</span>
						<span className="truncate font-medium text-foreground text-[11px]">
							{searchValue}
						</span>
						<span className="text-[10px] text-muted-foreground/70">
							(
							{searchResultsCount > 0
								? `${searchResultsCount} results`
								: "No results"}
							)
						</span>
					</>
				) : (
					<>
						<span className="text-[10px]" aria-hidden="true">
							📊
						</span>
						<span className="text-[10px] text-muted-foreground">
							{providers.length} providers,{" "}
							{currentProvider?.availableModels?.length || 0} models
						</span>
					</>
				)}
			</div>

			{/* Center - Quick shortcuts (only when not searching) */}
			{!searchValue && (
				<div className="hidden lg:flex items-center gap-3">
					<ShortcutHint shortcut="P" label="Providers" />
					<ShortcutHint shortcut="M" label="Models" />
					<ShortcutHint shortcut="T" label="Tips" />
				</div>
			)}

			{/* Right side - Navigation hints */}
			<div className="flex items-center gap-2 shrink-0">
				<CommandMenuKbd
					className="h-4 text-[10px] bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-white/20"
					aria-label="Press Escape to close"
					title="Press Escape to close"
				>
					ESC
				</CommandMenuKbd>
			</div>
		</div>
	);
}

// Helper components
function ShortcutHint({
	shortcut,
	label,
}: { shortcut: string; label: string }) {
	return (
		<div
			className="flex items-center gap-1 hover:text-foreground transition-colors cursor-help px-2 py-1 rounded-md hover:bg-gray-100/50 dark:hover:bg-white/[0.05]"
			title={`Press ${shortcut} to filter ${label.toLowerCase()}`}
		>
			<CommandMenuKbd className="h-4 text-[10px] bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-white/20">
				{shortcut}
			</CommandMenuKbd>
			<span className="text-[10px]">{label}</span>
		</div>
	);
}
