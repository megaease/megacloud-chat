"use client";

import type React from "react";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
	IconSettings,
	IconChevronDown,
	IconSearch,
	IconWorld,
	IconCpu,
	IconBolt,
	IconCheck,
} from "@tabler/icons-react";
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
import { useApiProvider } from "@/context/api-provider-context";
import { cn } from "@/lib/utils";
import { getProviderTypeInfo } from "./utils";
import { CornerDownLeftIcon } from "lucide-react";

interface UnifiedProviderModelSelectorProps {
	className?: string;
	mobile?: boolean;
}

export function UnifiedProviderModelSelector({
	className,
	mobile = false,
}: UnifiedProviderModelSelectorProps) {
	const {
		providers,
		currentProvider,
		currentModel,
		switchProvider,
		switchModel,
		setProviderModalOpen,
	} = useApiProvider();

	const [isOpen, setIsOpen] = useState(false);
	const [selectedValue, setSelectedValue] = useState<string>("");
	const [searchValue, setSearchValue] = useState<string>("");
	const [resultsCount, setResultsCount] = useState<number>(0);

	// Parse selected value to get display info
	const getSelectedItemInfo = (value: string) => {
		if (!value) return null;

		// Provider selection
		if (value.includes("provider:") && value.includes("-provider")) {
			const match = value.match(/provider:(.+)-(.+)-provider/);
			if (match) {
				const providerName = match[1];
				const category = match[2];
				return {
					type: "Provider",
					name: providerName,
					category: category,
					icon: "🌐"
				};
			}
		}

		// Model selection
		if (value.includes("model:") && value.includes("-model")) {
			const match = value.match(/model:(.+)-model/);
			if (match) {
				const modelName = match[1];
				return {
					type: "Model",
					name: modelName,
					category: currentProvider?.name || "",
					icon: "🤖"
				};
			}
		}

		// Quick access items
		if (value.includes("quick-browse-show-all-providers")) {
			return {
				type: "Quick Access",
				name: "Show All Providers",
				category: "Browse",
				icon: "🚀"
			};
		}

		if (value.includes("quick-browse-show-all-models")) {
			return {
				type: "Quick Access",
				name: "Show All Models",
				category: "Browse",
				icon: "🚀"
			};
		}

		if (value.includes("quick-show-tips")) {
			return {
				type: "Quick Access",
				name: "Show Usage Tips",
				category: "Help",
				icon: "💡"
			};
		}

		// Tips sections
		if (value.includes("tips:keyboard-shortcuts")) {
			return {
				type: "Usage Tips",
				name: "Keyboard Shortcuts",
				category: "Help",
				icon: "⌨️"
			};
		}

		if (value.includes("tips:search-patterns")) {
			return {
				type: "Usage Tips",
				name: "Search Patterns",
				category: "Help",
				icon: "🔍"
			};
		}

		if (value.includes("tips:workflow")) {
			return {
				type: "Usage Tips",
				name: "Workflow Tips",
				category: "Help",
				icon: "💡"
			};
		}

		// Actions
		if (value.toLowerCase().includes("manage") || value.toLowerCase().includes("settings")) {
			return {
				type: "Action",
				name: "Manage Providers",
				category: "Settings",
				icon: "⚙️"
			};
		}

		// Fallback for any other items
		if (value.length > 0) {
			// Try to extract a meaningful name from the value
			let displayName = value;
			
			// Remove common prefixes
			displayName = displayName.replace(/^(provider:|model:|tips:|quick-)/, '');
			displayName = displayName.replace(/-[a-z]+$/, ''); // Remove suffix like -provider, -model
			
			// Capitalize first letter and limit length
			displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
			if (displayName.length > 25) {
				displayName = displayName.substring(0, 25) + "...";
			}

			return {
				type: "Item",
				name: displayName,
				category: "",
				icon: "📄"
			};
		}

		return null;
	};

	// Optimized keyboard shortcuts handler - defined before useEffect
	const handleKeyboardShortcut = useCallback((inputValue: string) => {
		const input = document.querySelector("[cmdk-input]") as HTMLInputElement;
		if (!input) return;

		const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
			window.HTMLInputElement.prototype,
			"value",
		)?.set;
		
		if (nativeInputValueSetter) {
			nativeInputValueSetter.call(input, inputValue);
			input.dispatchEvent(
				new InputEvent("input", {
					bubbles: true,
					cancelable: true,
					inputType: "insertText",
					data: inputValue,
					composed: true,
				}),
			);
			input.dispatchEvent(new Event("change", { bubbles: true }));
		}
	}, []);

	// Keyboard shortcut support
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setIsOpen((open) => !open);
			}

			// Only handle these shortcuts when the dialog is open
			if (isOpen) {
				if (e.key === "p" && !e.metaKey && !e.ctrlKey && !e.altKey) {
					const input = document.querySelector(
						"[cmdk-input]",
					) as HTMLInputElement;
					if (input && document.activeElement === input && input.value === "") {
						e.preventDefault();
						handleKeyboardShortcut("provider:");
					}
				}

				if (e.key === "m" && !e.metaKey && !e.ctrlKey && !e.altKey) {
					const input = document.querySelector(
						"[cmdk-input]",
					) as HTMLInputElement;
					if (
						input &&
						document.activeElement === input &&
						input.value === "" &&
						currentProvider?.availableModels?.length
					) {
						e.preventDefault();
						handleKeyboardShortcut("model:");
					}
				}

				if (e.key === "t" && !e.metaKey && !e.ctrlKey && !e.altKey) {
					const input = document.querySelector(
						"[cmdk-input]",
					) as HTMLInputElement;
					if (input && document.activeElement === input && input.value === "") {
						e.preventDefault();
						handleKeyboardShortcut("tips:");
					}
				}
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [isOpen, currentProvider?.availableModels?.length, handleKeyboardShortcut]);

	// Group providers by type for better browsing
	const providersByType = useMemo(() => {
		const grouped = providers.reduce(
			(acc, provider) => {
				if (provider.id === currentProvider?.id) return acc; // Exclude current provider

				const typeInfo = getProviderTypeInfo(provider.providerType);
				const typeName = typeInfo.name;

				if (!acc[typeName]) {
					acc[typeName] = [];
				}
				acc[typeName].push(provider);
				return acc;
			},
			{} as Record<string, typeof providers>,
		);

		return grouped;
	}, [providers, currentProvider?.id]);

	// Track search results count for footer display
	const searchResultsCount = useMemo(() => {
		if (!searchValue.trim()) return 0;
		
		// Count potential matches
		let count = 0;
		
		// Quick access items
		if ("provider:".includes(searchValue.toLowerCase()) || "providers".includes(searchValue.toLowerCase())) count++;
		if ("model:".includes(searchValue.toLowerCase()) || "models".includes(searchValue.toLowerCase())) count++;
		if ("tips:".includes(searchValue.toLowerCase()) || "tips".includes(searchValue.toLowerCase())) count++;
		
		// Current provider's models
		if (currentProvider?.availableModels) {
			count += currentProvider.availableModels.filter(model => 
				model.toLowerCase().includes(searchValue.toLowerCase())
			).length;
		}
		
		// Other providers
		count += providers.filter(provider => 
			provider.name.toLowerCase().includes(searchValue.toLowerCase()) ||
			provider.providerType.toLowerCase().includes(searchValue.toLowerCase())
		).length;
		
		return count;
	}, [searchValue, providers, currentProvider]);

	// Optimized input handler with debouncing
	const handleSearchChange = useCallback((value: string) => {
		setSearchValue(value);
		setResultsCount(searchResultsCount);
	}, [searchResultsCount]);

	// If no current provider, show settings button
	if (!currentProvider) {
		return (
			<Button
				variant="outline"
				className={cn(
					"justify-start gap-2 border-dashed hover:border-solid transition-all duration-200",
					mobile ? "w-full text-xs h-8" : "w-full h-10",
					className,
				)}
				onClick={() => setProviderModalOpen(true)}
			>
				<IconSettings className="h-4 w-4 text-muted-foreground" />
				<span className="text-muted-foreground">Set API Provider</span>
			</Button>
		);
	}

	return (
		<>
			<Button
				variant="outline"
				className={cn(
					"justify-between gap-2 transition-all duration-200 hover:shadow-sm group",
					mobile ? "w-full text-xs h-8" : "w-full h-10",
					className,
				)}
				onClick={() => setIsOpen(true)}
				title="Click to open or press ⌘K / Ctrl+K"
			>
				<div className="flex items-center gap-2 truncate min-w-0">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						{getProviderTypeInfo(currentProvider.providerType).icon}
						<span className="hidden sm:inline">{currentProvider.name}</span>
					</div>
					<span className="text-xs text-muted-foreground hidden sm:inline">
						/
					</span>
					<span className="truncate font-medium">
						{currentModel || "Select Model"}
					</span>
				</div>
				<div className="flex items-center gap-2">
					<IconChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
					<kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 group-hover:bg-muted-foreground/10 transition-colors">
						<span className="text-xs">⌘</span>K
					</kbd>
				</div>
			</Button>

			<CommandDialog open={isOpen} onOpenChange={setIsOpen} className="pb-11">
				<Command value={selectedValue} onValueChange={setSelectedValue}>
					<CommandInput 
						placeholder="Search providers & models..." 
						autoFocus 
						onValueChange={handleSearchChange}
					/>
					<CommandList>
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
										<code className="px-1 py-0.5 rounded bg-muted">model:</code>{" "}
										to find models
									</p>
									<p>
										•{" "}
										<code className="px-1 py-0.5 rounded bg-muted">tips:</code>{" "}
										to show usage tips
									</p>
									<p>
										• Press{" "}
										<kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">
											P
										</kbd>{" "}
										for providers,{" "}
										<kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">
											M
										</kbd>{" "}
										for models,{" "}
										<kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">
											T
										</kbd>{" "}
										for tips
									</p>
								</div>
							</div>
						</div>
					</CommandEmpty>

					{/* Quick access commands */}
					<CommandGroup heading="Quick Access">
						<CommandItem
							value="quick-browse-show-all-providers-provider"
							onSelect={() => {
								// Use a small delay to allow the command to register, then filter
								setTimeout(() => {
									const input = document.querySelector(
										"[cmdk-input]",
									) as HTMLInputElement;
									if (input) {
										// Use the same comprehensive approach as keyboard shortcuts
										const nativeInputValueSetter =
											Object.getOwnPropertyDescriptor(
												window.HTMLInputElement.prototype,
												"value",
											)?.set;
										if (nativeInputValueSetter) {
											nativeInputValueSetter.call(input, "provider:");
											input.dispatchEvent(
												new InputEvent("input", {
													bubbles: true,
													cancelable: true,
													inputType: "insertText",
													data: "provider:",
													composed: true,
												}),
											);
											input.dispatchEvent(
												new Event("change", { bubbles: true }),
											);
										}
									}
								}, 50);
							}}
							className="flex items-center gap-2"
						>
							<IconWorld className="h-4 w-4 text-blue-500" />
							<div className="flex flex-col flex-1">
								<span>Show All Providers</span>
								<span className="text-xs text-muted-foreground">
									Type "provider:" to filter providers
								</span>
							</div>
							<kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 hidden sm:inline-flex">
								P
							</kbd>
						</CommandItem>
						{currentProvider?.availableModels?.length ? (
							<CommandItem
								value="quick-browse-show-all-models-model"
								onSelect={() => {
									setTimeout(() => {
										const input = document.querySelector(
											"[cmdk-input]",
										) as HTMLInputElement;
										if (input) {
											// Use the same comprehensive approach as keyboard shortcuts
											const nativeInputValueSetter =
												Object.getOwnPropertyDescriptor(
													window.HTMLInputElement.prototype,
													"value",
												)?.set;
											if (nativeInputValueSetter) {
												nativeInputValueSetter.call(input, "model:");
												input.dispatchEvent(
													new InputEvent("input", {
														bubbles: true,
														cancelable: true,
														inputType: "insertText",
														data: "model:",
														composed: true,
													}),
												);
												input.dispatchEvent(
													new Event("change", { bubbles: true }),
												);
											}
										}
									}, 50);
								}}
								className="flex items-center gap-2"
							>
								<IconCpu className="h-4 w-4 text-purple-500" />
								<div className="flex flex-col flex-1">
									<span>Show All Models</span>
									<span className="text-xs text-muted-foreground">
										Type "model:" to filter models
									</span>
								</div>
								<kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 hidden sm:inline-flex">
									M
								</kbd>
							</CommandItem>
						) : null}
						<CommandItem
							value="quick-show-tips-tips"
							onSelect={() => {
								setTimeout(() => {
									const input = document.querySelector(
										"[cmdk-input]",
									) as HTMLInputElement;
									if (input) {
										// Use the same comprehensive approach as keyboard shortcuts
										const nativeInputValueSetter =
											Object.getOwnPropertyDescriptor(
												window.HTMLInputElement.prototype,
												"value",
											)?.set;
										if (nativeInputValueSetter) {
											nativeInputValueSetter.call(input, "tips:");
											input.dispatchEvent(
												new InputEvent("input", {
													bubbles: true,
													cancelable: true,
													inputType: "insertText",
													data: "tips:",
													composed: true,
												}),
											);
											input.dispatchEvent(
												new Event("change", { bubbles: true }),
											);
										}
									}
								}, 50);
							}}
							className="flex items-center gap-2"
						>
							<IconBolt className="h-4 w-4 text-orange-500" />
							<div className="flex flex-col flex-1">
								<span>Show Quick Tips</span>
								<span className="text-xs text-muted-foreground">
									Type "tips:" to see helpful usage tips
								</span>
							</div>
							<kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 hidden sm:inline-flex">
								T
							</kbd>
						</CommandItem>
					</CommandGroup>
					<CommandSeparator />

					{/* Current provider's models - always show first for quick model switching */}
					{currentProvider?.availableModels?.length ? (
						<>
							<CommandGroup heading={`${currentProvider.name} Models`}>
								{currentProvider.availableModels.map((model) => {
									const isSelected = currentModel === model;

									return (
										<CommandItem
											key={model}
											value={`model:${model}-model`}
											onSelect={() => {
												switchModel(model);
												setIsOpen(false);
											}}
											className="flex items-center justify-between"
										>
											<div className="flex flex-col">
												<span className="font-medium">{model}</span>
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
											{isSelected && <IconCheck className="h-4 w-4" />}
										</CommandItem>
									);
								})}
							</CommandGroup>
							<CommandSeparator />
						</>
					) : null}

					{/* Providers grouped by type for easy browsing */}
					{Object.entries(providersByType).map(([typeName, typeProviders]) => (
						<div key={typeName}>
							<CommandGroup heading={`${typeName} Providers`}>
								{typeProviders.map((provider) => {
									const typeInfo = getProviderTypeInfo(provider.providerType);
									const modelCount = provider.availableModels?.length || 0;

									return (
										<CommandItem
											key={provider.id}
											value={`provider:${provider.name}-${typeName}-provider`}
											onSelect={() => {
												switchProvider(provider.id);
												switchModel("");
												// After selecting provider, automatically show models
												setTimeout(() => {
													const input = document.querySelector(
														"[cmdk-input]",
													) as HTMLInputElement;
													if (input) {
														// Use the same comprehensive approach as keyboard shortcuts
														const nativeInputValueSetter =
															Object.getOwnPropertyDescriptor(
																window.HTMLInputElement.prototype,
																"value",
															)?.set;
														if (nativeInputValueSetter) {
															nativeInputValueSetter.call(input, "model:");
															input.dispatchEvent(
																new InputEvent("input", {
																	bubbles: true,
																	cancelable: true,
																	inputType: "insertText",
																	data: "model:",
																	composed: true,
																}),
															);
															input.dispatchEvent(
																new Event("change", { bubbles: true }),
															);
														}
													}
												}, 100);
											}}
											className="flex items-center gap-3"
										>
											<div
												className={cn(
													"flex items-center gap-1",
													typeInfo.color,
												)}
											>
												{typeInfo.icon}
											</div>
											<div className="flex flex-col flex-1">
												<span className="font-medium">{provider.name}</span>
												<span className="text-xs text-muted-foreground">
													{modelCount > 0
														? `${modelCount} models available`
														: "Configure models needed"}
												</span>
											</div>
										</CommandItem>
									);
								})}
							</CommandGroup>
							<CommandSeparator />
						</div>
					))}

					{/* Tips section - shows when user searches for "tips:" */}
					<CommandGroup heading="📚 Usage Tips">
						<CommandItem
							value="tips:keyboard-shortcuts-tips"
							className="flex flex-col items-start gap-2 py-4 cursor-default"
							onSelect={() => {}}
						>
							<div className="w-full">
								<div className="flex items-center gap-2 mb-2">
									<IconBolt className="h-4 w-4 text-yellow-500" />
									<h4 className="font-medium text-sm">Keyboard Shortcuts</h4>
								</div>
								<div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
									<p>
										• <kbd className="px-1 rounded bg-muted">⌘K</kbd> /{" "}
										<kbd className="px-1 rounded bg-muted">Ctrl+K</kbd> -
										Open/close this dialog
									</p>
									<p>
										• <kbd className="px-1 rounded bg-muted">P</kbd> - Quick
										filter providers
									</p>
									<p>
										• <kbd className="px-1 rounded bg-muted">M</kbd> - Quick
										filter models
									</p>
									<p>
										• <kbd className="px-1 rounded bg-muted">T</kbd> - Show tips
										(this section)
									</p>
								</div>
							</div>
						</CommandItem>
						<CommandItem
							value="tips:search-patterns-tips"
							className="flex flex-col items-start gap-2 py-4 cursor-default"
							onSelect={() => {}}
						>
							<div className="w-full">
								<div className="flex items-center gap-2 mb-2">
									<IconSearch className="h-4 w-4 text-blue-500" />
									<h4 className="font-medium text-sm">Search Patterns</h4>
								</div>
								<div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
									<p>
										• <code className="px-1 rounded bg-muted">provider:</code> -
										Filter and browse all providers
									</p>
									<p>
										• <code className="px-1 rounded bg-muted">model:</code> -
										Filter and browse available models
									</p>
									<p>
										• <code className="px-1 rounded bg-muted">tips:</code> -
										Show this help section
									</p>
									<p>• Just type any text to search across everything</p>
								</div>
							</div>
						</CommandItem>
						<CommandItem
							value="tips:workflow-tips"
							className="flex flex-col items-start gap-2 py-4 cursor-default"
							onSelect={() => {}}
						>
							<div className="w-full">
								<div className="flex items-center gap-2 mb-2">
									<IconWorld className="h-4 w-4 text-green-500" />
									<h4 className="font-medium text-sm">Workflow Tips</h4>
								</div>
								<div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
									<p>
										• Select a provider → automatically get "model:" to choose
										models
									</p>
									<p>
										• Current provider's models always show first for quick
										switching
									</p>
									<p>
										• Providers are grouped by type (OpenAI, Anthropic, etc.)
									</p>
									<p>• Use Quick Access for common actions</p>
								</div>
							</div>
						</CommandItem>
					</CommandGroup>

					<CommandGroup heading="Actions">
						<CommandItem
							onSelect={() => {
								setProviderModalOpen(true);
								setIsOpen(false);
							}}
							className="flex items-center gap-2"
						>
							<IconSettings className="h-4 w-4 text-gray-500" />
							<div className="flex flex-col flex-1">
								<span>Manage Providers</span>
								<span className="text-xs text-muted-foreground">
									Add, edit, or configure API providers
								</span>
							</div>
						</CommandItem>
					</CommandGroup>
				</CommandList>
				{/* Enhanced Footer with better accessibility and functionality */}
				<footer 
					className="text-muted-foreground absolute inset-x-0 bottom-0 z-20 flex h-12 items-center justify-between rounded-b-xl border-t border-t-neutral-100 bg-neutral-50/95 backdrop-blur-sm px-4 text-xs font-medium dark:border-t-neutral-700 dark:bg-neutral-800/95"
					role="status"
					aria-label="Command palette status and shortcuts"
				>
					{/* Left side - Current selection or search status */}
					<div className="flex items-center gap-2 min-w-0 flex-1" role="status" aria-live="polite">
						{(() => {
							// Show search status if actively searching
							if (searchValue && searchValue.trim()) {
								const resultText = searchResultsCount > 0 
									? `${searchResultsCount} results` 
									: "No results";
								return (
									<>
										<span className="text-[10px]" aria-hidden="true">🔍</span>
										<span className="text-[10px] text-blue-500">Search:</span>
										<span className="truncate font-medium text-foreground text-[11px] sm:text-xs">
											{searchValue}
										</span>
										<span className="text-[10px] text-muted-foreground/70 hidden md:inline">
											({resultText})
										</span>
									</>
								);
							}

							// Show selected item info
							const selectedInfo = getSelectedItemInfo(selectedValue);
							if (selectedInfo) {
								return (
									<>
										<div className="flex items-center gap-1 shrink-0">
											<span className="text-[10px]" aria-hidden="true">{selectedInfo.icon}</span>
											<span className="text-[10px] text-muted-foreground/80 hidden sm:inline">
												{selectedInfo.type}
											</span>
										</div>
										<span className="text-muted-foreground/60 hidden sm:inline" aria-hidden="true">→</span>
										<div className="flex items-center gap-1 min-w-0 flex-1">
											<span className="truncate font-medium text-foreground text-[11px] sm:text-xs">
												{selectedInfo.name}
											</span>
											{selectedInfo.category && (
												<span className="text-[10px] text-muted-foreground/60 hidden lg:inline shrink-0">
													({selectedInfo.category})
												</span>
											)}
										</div>
										<div className="flex items-center gap-1 shrink-0 ml-2">
											<CommandMenuKbd className="h-4 text-[10px]" aria-label="Press Enter to select">
												<CornerDownLeftIcon className="h-3 w-3" />
											</CommandMenuKbd>
											<span className="text-[10px] hidden sm:inline">Select</span>
										</div>
									</>
								);
							}

							// Default state - show basic info
							const totalProviders = providers.length;
							const totalModels = currentProvider?.availableModels?.length || 0;
							return (
								<div className="flex items-center gap-2">
									<span className="text-[10px]" aria-hidden="true">📊</span>
									<span className="text-[10px] text-muted-foreground">
										{totalProviders} providers, {totalModels} models
									</span>
									<span className="text-muted-foreground/60 hidden sm:inline" aria-hidden="true">•</span>
									<CommandMenuKbd className="hidden sm:inline-flex h-4 text-[10px]" aria-label="Press Enter to select">
										<CornerDownLeftIcon className="h-3 w-3" />
									</CommandMenuKbd>
									<span className="hidden sm:inline text-[10px]">Select</span>
								</div>
							);
						})()}
					</div>

					{/* Center - Quick shortcuts (only when not searching/selecting) */}
					{!searchValue && !getSelectedItemInfo(selectedValue) && (
						<nav className="hidden md:flex" role="navigation" aria-label="Keyboard shortcuts">
							{/* Extra large screens - full labels */}
							<div className="hidden xl:flex items-center gap-4">
								<div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-help" title="Press P to filter providers">
									<CommandMenuKbd className="h-4 text-[10px]" aria-label="Press P for providers">P</CommandMenuKbd>
									<span className="text-[10px]">Providers</span>
								</div>
								<div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-help" title="Press M to filter models">
									<CommandMenuKbd className="h-4 text-[10px]" aria-label="Press M for models">M</CommandMenuKbd>
									<span className="text-[10px]">Models</span>
									{currentProvider?.availableModels?.length ? (
										<span className="text-green-500 ml-1 text-[8px]" aria-hidden="true">•</span>
									) : null}
								</div>
								<div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-help" title="Press T to show tips">
									<CommandMenuKbd className="h-4 text-[10px]" aria-label="Press T for tips">T</CommandMenuKbd>
									<span className="text-[10px]">Tips</span>
								</div>
							</div>

							{/* Large screens - compact version */}
							<div className="hidden lg:flex xl:hidden items-center gap-2">
								<CommandMenuKbd className="h-4 text-[10px]" aria-label="Press P for providers" title="Press P to filter providers">P</CommandMenuKbd>
								<CommandMenuKbd className="h-4 text-[10px]" aria-label="Press M for models" title="Press M to filter models">M</CommandMenuKbd>
								<CommandMenuKbd className="h-4 text-[10px]" aria-label="Press T for tips" title="Press T to show tips">T</CommandMenuKbd>
							</div>

							{/* Medium screens - ultra compact */}
							<div className="hidden md:flex lg:hidden items-center gap-1">
								<CommandMenuKbd className="text-[10px] h-4 px-1" aria-label="Press P, M, or T for shortcuts" title="Press P (providers), M (models), or T (tips)">PMT</CommandMenuKbd>
							</div>
						</nav>
					)}

					{/* Right side - Navigation hints */}
					<nav className="flex items-center gap-2 shrink-0" role="navigation" aria-label="Navigation shortcuts">
						<div className="hidden sm:flex items-center gap-1">
							<CommandMenuKbd className="h-4 text-[10px]" aria-label="Use arrow keys to navigate" title="Use arrow keys to navigate">↑↓</CommandMenuKbd>
							<span className="hidden lg:inline text-[10px]">Navigate</span>
						</div>
						<div className="flex items-center gap-1">
							<CommandMenuKbd className="h-4 text-[10px]" aria-label="Press Escape to close" title="Press Escape to close">ESC</CommandMenuKbd>
							<span className="hidden md:inline text-[10px]">Close</span>
						</div>
					</nav>
				</footer>
				</Command>
			</CommandDialog>
		</>
	);
}

function CommandMenuKbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "bg-background text-muted-foreground pointer-events-none flex h-5 items-center justify-center gap-1 rounded border px-1 font-sans text-[0.7rem] font-medium select-none [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    />
  )
}
