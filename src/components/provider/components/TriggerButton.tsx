// components/TriggerButton.tsx
import { Button } from "@/components/ui/button";
import { IconSettings, IconChevronDown } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getProviderTypeInfo } from "../utils";
import type { ApiProvider } from "@/types/api-provider";

interface TriggerButtonProps {
	currentProvider: ApiProvider | null;
	currentModel: string;
	mobile?: boolean;
	className?: string;
	onClick: () => void;
	onSettingsClick: () => void;
}

export function TriggerButton({
	currentProvider,
	currentModel,
	mobile = false,
	className,
	onClick,
	onSettingsClick,
}: TriggerButtonProps) {
	const t = useTranslations("Chat");

	// If no provider, show settings button
	if (!currentProvider) {
		return (
			<Button
				variant="outline"
				className={cn(
					"justify-start gap-2 border-dashed hover:border-solid transition-all duration-200",
					mobile ? "w-full text-xs h-8" : "w-full h-10",
					className,
				)}
				onClick={onSettingsClick}
			>
				<IconSettings className="h-4 w-4 text-muted-foreground" />
				<span className="text-muted-foreground">Set API Provider</span>
			</Button>
		);
	}

	return (
		<Button
			variant="outline"
			className={cn(
				"relative justify-between gap-2 transition-all duration-200 group",
				"bg-white/80 dark:bg-black/40 backdrop-blur border border-gray-200 border-solid dark:border-white/20",
				"hover:bg-white dark:hover:bg-black/50 hover:border-gray-300 dark:hover:border-white/30",
				"rounded-xl font-medium",
				mobile ? "w-full text-xs h-8" : "w-full h-10",
				className,
			)}
			onClick={onClick}
			title="Click to open or press ⌘K / Ctrl+K"
		>
			{/* 精致装饰边框 */}
			<div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-purple-500/5 to-pink-500/8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

			<div className="relative flex items-center gap-2 truncate min-w-0">
				<div
					className={cn(
						"flex items-center gap-1.5 text-xs font-medium",
						getProviderTypeInfo(currentProvider.providerType).color,
					)}
				>
					{getProviderTypeInfo(currentProvider.providerType).icon}
					<span className="hidden sm:inline">{currentProvider.name}</span>
				</div>
				<div className="w-px h-4 bg-gray-300 dark:bg-white/20 hidden sm:block" />
				<span className="truncate font-medium text-sm">
					{currentModel || t("selectModel")}
				</span>
			</div>
			<div className="relative flex items-center gap-2">
				<IconChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:scale-110" />
				<kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded-md border border-gray-200/60 border-solid dark:border-white/20 bg-gray-50/80 dark:bg-white/[0.06] px-2 font-mono text-[10px] font-medium text-muted-foreground pointer-events-none group-hover:bg-gray-100/80 dark:group-hover:bg-white/[0.08] transition-colors">
					<span className="text-xs">⌘</span>K
				</kbd>
			</div>
		</Button>
	);
}
