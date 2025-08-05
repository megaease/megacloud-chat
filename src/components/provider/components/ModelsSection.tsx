// components/ModelsSection.tsx
import {
	CommandGroup,
	CommandItem,
	CommandSeparator,
} from "@/components/ui/command";
import type { ApiProvider } from "@/types/api-provider";
import { CommandMenuKbd, EnterKeyIcon } from "./shared";

interface ModelsSectionProps {
	currentProvider: ApiProvider;
	currentModel: string;
	onModelSelect: (model: string) => void;
	onClose: () => void;
}

export function ModelsSection({
	currentProvider,
	currentModel,
	onModelSelect,
	onClose,
}: ModelsSectionProps) {
	if (!currentProvider?.availableModels?.length) {
		return null;
	}

	return (
		<>
			<CommandGroup heading={`🎯 ${currentProvider.name} Models`}>
				{currentProvider.availableModels.map((model) => {
					const isSelected = currentModel === model;

					return (
						<CommandItem
							key={model}
							value={`model:${model}-model`}
							onSelect={() => {
								onModelSelect(model);
								onClose();
							}}
							className="group/item relative flex items-center justify-between p-3 rounded-xl transition-all duration-200 cursor-pointer hover:bg-white/70 dark:hover:bg-white/10 border border-transparent hover:border-gray-200/60 dark:hover:border-white/15 backdrop-blur-sm"
						>
							{/* 当前选中的背景渐变 */}
							{isSelected && (
								<div className="absolute inset-0 bg-gradient-to-r from-blue-50/90 via-purple-50/70 to-pink-50/90 dark:from-blue-950/60 dark:via-purple-950/50 dark:to-pink-950/60 rounded-xl" />
							)}

							{/* 悬浮背景渐变 */}
							{!isSelected && (
								<div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 via-purple-500/6 to-pink-500/8 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 rounded-xl" />
							)}

							<div className="relative z-10 flex flex-col">
								<div className="flex items-center gap-2">
									<span className="font-semibold text-sm">{model}</span>
									{isSelected && (
										<div className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-md">
											Current
										</div>
									)}
								</div>
								{model.includes("gpt-4") && (
									<span className="text-xs text-muted-foreground">
										Advanced Model
									</span>
								)}
								{model.includes("gpt-3.5") && (
									<span className="text-xs text-muted-foreground">
										Standard Model
									</span>
								)}
							</div>
							<div className="relative z-10 flex items-center gap-2">
								{isSelected && (
									<div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
								)}
								{!isSelected && (
									<CommandMenuKbd
										className="opacity-0 group-aria-selected/item:opacity-100 transition-opacity"
										aria-label="Press Enter to select"
									>
										<EnterKeyIcon />
									</CommandMenuKbd>
								)}
							</div>
						</CommandItem>
					);
				})}
			</CommandGroup>
			<CommandSeparator className="bg-gradient-to-r from-transparent via-gray-300/40 dark:via-white/20 to-transparent my-2" />
		</>
	);
}
