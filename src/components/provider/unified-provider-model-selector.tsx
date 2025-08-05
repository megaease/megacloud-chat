"use client";

import type React from "react";
import { useTranslations } from "next-intl";
import { IconSearch, IconSettings } from "@tabler/icons-react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	Command,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

// Hooks and components
import { useProviderModelSelector } from "./hooks/useProviderModelSelector";
import { TriggerButton } from "./components/TriggerButton";
import { QuickAccessSection } from "./components/QuickAccessSection";
import { ModelsSection } from "./components/ModelsSection";
import { ProvidersSection } from "./components/ProvidersSection";
import { TipsSection } from "./components/TipsSection";
import { CommandFooter } from "./components/CommandFooter";

interface UnifiedProviderModelSelectorProps {
	className?: string;
	mobile?: boolean;
}

export function UnifiedProviderModelSelector({
	className,
	mobile = false,
}: UnifiedProviderModelSelectorProps) {
	const tCommon = useTranslations("Common");

	const {
		// State
		isOpen,
		setIsOpen,
		selectedValue,
		setSelectedValue,
		searchValue,
		searchResultsCount,

		// Handlers
		handleSearchChange,
		handleKeyboardShortcut,

		// Provider data
		providers,
		currentProvider,
		currentModel,
		switchProvider,
		switchModel,
		setProviderModalOpen,
	} = useProviderModelSelector();

	// Filter handlers for quick access
	const handleProviderFilter = () => {
		setTimeout(() => handleKeyboardShortcut("provider:"), 50);
	};

	const handleModelFilter = () => {
		setTimeout(() => handleKeyboardShortcut("model:"), 50);
	};

	const handleTipsFilter = () => {
		setTimeout(() => handleKeyboardShortcut("tips:"), 50);
	};

	// Provider selection with auto model filtering
	const handleProviderSelect = (providerId: string) => {
		switchProvider(providerId);
		switchModel("");
	};

	const handleAutoShowModels = () => {
		setTimeout(() => handleKeyboardShortcut("model:"), 100);
	};

	return (
		<>
			<TriggerButton
				currentProvider={currentProvider}
				currentModel={currentModel}
				mobile={mobile}
				className={className}
				onClick={() => setIsOpen(true)}
				onSettingsClick={() => setProviderModalOpen(true)}
			/>

			<CommandDialog
				open={isOpen}
				onOpenChange={setIsOpen}
				className="rounded-2xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-gray-200/60 border-solid dark:border-white/15"
			>
				{/* 现代渐变边框效果 */}
				<div className="absolute inset-0 bg-gradient-to-br from-blue-500/12 via-purple-500/8 to-pink-500/12 rounded-2xl" />

				<Command
					value={selectedValue}
					onValueChange={setSelectedValue}
					className="relative"
				>
					<CommandInput
						placeholder={tCommon("search")}
						autoFocus
						onValueChange={handleSearchChange}
						className="h-12 text-sm border-none bg-transparent px-6 py-4 placeholder:text-muted-foreground/60 focus:ring-0"
					/>

					<CommandList className="pb-12 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300/50">
						<CommandEmpty>
							<div className="flex flex-col items-center gap-3 py-8 text-center">
								<IconSearch className="h-10 w-10 text-muted-foreground" />
								<div className="text-sm text-muted-foreground">
									<p className="mb-2 font-medium">No results found.</p>
									<div className="space-y-1 text-xs">
										<p>💡 Try these search patterns:</p>
										<p>
											•{" "}
											<code className="px-1 py-0.5 rounded bg-muted">
												provider:
											</code>{" "}
											to browse providers
										</p>
										<p>
											•{" "}
											<code className="px-1 py-0.5 rounded bg-muted">
												model:
											</code>{" "}
											to find models
										</p>
										<p>
											•{" "}
											<code className="px-1 py-0.5 rounded bg-muted">
												tips:
											</code>{" "}
											to show usage tips
										</p>
										<p>
											• Press{" "}
											<kbd className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] border">
												P
											</kbd>{" "}
											for providers,{" "}
											<kbd className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] border">
												M
											</kbd>{" "}
											for models,{" "}
											<kbd className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] border">
												T
											</kbd>{" "}
											for tips
										</p>
									</div>
								</div>
							</div>
						</CommandEmpty>

						{/* Quick Access Section */}
						<QuickAccessSection
							currentProvider={currentProvider}
							onProviderFilter={handleProviderFilter}
							onModelFilter={handleModelFilter}
							onTipsFilter={handleTipsFilter}
						/>
						<CommandSeparator className="bg-gradient-to-r from-transparent via-gray-300/40 dark:via-white/20 to-transparent my-2" />

						{/* Current Provider Models Section */}
						{currentProvider && (
							<ModelsSection
								currentProvider={currentProvider}
								currentModel={currentModel}
								onModelSelect={switchModel}
								onClose={() => setIsOpen(false)}
							/>
						)}

						{/* Providers Section */}
						<ProvidersSection
							providers={providers}
							currentProvider={currentProvider}
							onProviderSelect={handleProviderSelect}
							onAutoShowModels={handleAutoShowModels}
						/>

						{/* Tips Section */}
						<TipsSection />

						{/* Actions Section */}
						<CommandGroup heading="Actions">
							<CommandItem
								onSelect={() => {
									setProviderModalOpen(true);
									setIsOpen(false);
								}}
								className="flex items-center gap-3 group/item"
							>
								<IconSettings className="h-5 w-5 text-gray-500" />
								<div className="flex flex-col flex-1">
									<span>Manage Providers</span>
									<span className="text-xs text-muted-foreground">
										Add, edit, or configure API providers
									</span>
								</div>
							</CommandItem>
						</CommandGroup>
					</CommandList>

					{/* Footer */}
					<CommandFooter
						searchValue={searchValue}
						searchResultsCount={searchResultsCount}
						providers={providers}
						currentProvider={currentProvider}
					/>
				</Command>
			</CommandDialog>
		</>
	);
}
