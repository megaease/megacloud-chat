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
	IconKeyboard,
	IconTarget,
	IconCornerDownLeft,
	IconArrowRight,
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
	}, [providers]);

	// Track search results count for footer display
	const searchResultsCount = useMemo(() => {
		if (!searchValue.trim()) return 0;
		
		let count = 0;
		const searchLower = searchValue.toLowerCase().trim();
		
		// Handle specific prefixes
		if (searchLower === 'provider:') {
			// Show all providers (including current one)
			return providers.length;
		}
		
		if (searchLower === 'model:') {
			// Show current provider's models
			return currentProvider?.availableModels?.length || 0;
		}
		
		if (searchLower === 'tips:') {
			// Show all tip items
			return 3;
		}
		
		// For other searches, count matches
		// Quick access items
		const quickAccessItems = [
			{ keywords: ["provider", "browse", "show all providers", "world"], condition: true },
			{ keywords: ["model", "show all models", "cpu"], condition: !!currentProvider?.availableModels?.length },
			{ keywords: ["tip", "help", "quick tips", "usage", "bolt"], condition: true }
		];
		
		quickAccessItems.forEach(item => {
			if (item.condition && item.keywords.some(keyword => 
				keyword.includes(searchLower) || searchLower.includes(keyword)
			)) {
				count++;
			}
		});
		
		// Current provider's models (only if not searching for providers specifically)
		if (!searchLower.includes('provider:') && currentProvider?.availableModels) {
			count += currentProvider.availableModels.filter(model => 
				model.toLowerCase().includes(searchLower)
			).length;
		}
		
		// Other providers (including current provider, only if not searching for models specifically)
		if (!searchLower.includes('model:')) {
			count += providers.filter(provider => 
				provider.name.toLowerCase().includes(searchLower) ||
				provider.providerType.toLowerCase().includes(searchLower)
			).length;
		}
		
		// Tips section items
		const tipKeywords = ["keyboard", "shortcut", "search", "pattern", "workflow"];
		if (tipKeywords.some(keyword => searchLower.includes(keyword))) {
			count += 3; // 3 tip items
		}
		
		// Management actions
		if (["manage", "setting", "config", "action"].some(keyword => searchLower.includes(keyword))) {
			count++;
		}
		
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
					"justify-between gap-2 transition-all duration-200 group",
					mobile ? "w-full text-xs h-8" : "w-full h-10",
					className,
				)}
				onClick={() => setIsOpen(true)}
				title="Click to open or press ⌘K / Ctrl+K"
			>
				<div className="flex items-center gap-2 truncate min-w-0">
					<div className={cn("flex items-center gap-1.5 text-xs", getProviderTypeInfo(currentProvider.providerType).color)}>
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
					<kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded-md border border-border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground pointer-events-none group-hover:bg-muted/80 transition-colors">
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
							className="flex items-center gap-3 group/item"
						>
							<IconWorld className="h-5 w-5 text-blue-500" />
							<div className="flex flex-col flex-1">
								<span>Show All Providers</span>
								<span className="text-xs text-muted-foreground">
									Type "provider:" to filter providers
								</span>
							</div>
							<div className="flex items-center gap-1">
								<kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded-md border border-border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground pointer-events-none">
									P
								</kbd>
								<CommandMenuKbd className="opacity-0 group-aria-selected/item:opacity-100 transition-opacity" aria-label="Press Enter to select">
									<EnterKeyIcon />
								</CommandMenuKbd>
							</div>
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
								className="flex items-center gap-3 group/item"
							>
								<IconCpu className="h-5 w-5 text-purple-500" />
								<div className="flex flex-col flex-1">
									<span>Show All Models</span>
									<span className="text-xs text-muted-foreground">
										Type "model:" to filter models
									</span>
								</div>
								<div className="flex items-center gap-1">
									<kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded-md border border-border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground pointer-events-none">
										M
									</kbd>
									<CommandMenuKbd className="opacity-0 group-aria-selected/item:opacity-100 transition-opacity" aria-label="Press Enter to select">
										<EnterKeyIcon />
									</CommandMenuKbd>
								</div>
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
							className="flex items-center gap-3 group/item"
						>
							<IconBolt className="h-5 w-5 text-orange-500" />
							<div className="flex flex-col flex-1">
								<span>Show Quick Tips</span>
								<span className="text-xs text-muted-foreground">
									Type "tips:" to see helpful usage tips
								</span>
							</div>
							<div className="flex items-center gap-1">
								<kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded-md border border-border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground pointer-events-none">
									T
								</kbd>
								<CommandMenuKbd className="opacity-0 group-aria-selected/item:opacity-100 transition-opacity" aria-label="Press Enter to select">
									<EnterKeyIcon />
								</CommandMenuKbd>
							</div>
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
											className="flex items-center justify-between group/item"
										>
											<div className="flex flex-col">
												<div className="flex items-center gap-2">
													<span className="font-medium">{model}</span>
													{isSelected && (
														<div className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900 dark:text-blue-300">
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
											<div className="flex items-center gap-2">
												<CommandMenuKbd className="opacity-0 group-aria-selected/item:opacity-100 transition-opacity" aria-label="Press Enter to select">
													<EnterKeyIcon />
												</CommandMenuKbd>
											</div>
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
									const isCurrent = provider.id === currentProvider?.id;

									return (
										<CommandItem
											key={provider.id}
											value={`provider:${provider.name}-${typeName}-provider`}
											onSelect={() => {
												if (!isCurrent) {
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
												}
											}}
											className="flex items-center gap-3 group/item"
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
												<div className="flex items-center gap-2">
													<span className="font-medium">{provider.name}</span>
													{isCurrent && (
														<div className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900 dark:text-blue-300">
															Current
														</div>
													)}
												</div>
												<span className="text-xs text-muted-foreground">
													{modelCount > 0
														? `${modelCount} models available`
														: "Configure models needed"}
												</span>
											</div>
											{!isCurrent && (
												<CommandMenuKbd className="opacity-0 group-aria-selected/item:opacity-100 transition-opacity" aria-label="Press Enter to select">
													<EnterKeyIcon />
												</CommandMenuKbd>
											)}
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
									<IconKeyboard className="h-5 w-5 text-yellow-500" />
									<h4 className="font-medium text-sm">Keyboard Shortcuts</h4>
								</div>
								<div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
									<p>
										• <kbd className="px-1.5 py-0.5 rounded-md bg-muted border">⌘K</kbd> /{" "}
										<kbd className="px-1.5 py-0.5 rounded-md bg-muted border">Ctrl+K</kbd> -
										Open/close this dialog
									</p>
									<p>
										• <kbd className="px-1.5 py-0.5 rounded-md bg-muted border">P</kbd> - Quick
										filter providers
									</p>
									<p>
										• <kbd className="px-1.5 py-0.5 rounded-md bg-muted border">M</kbd> - Quick
										filter models
									</p>
									<p>
										• <kbd className="px-1.5 py-0.5 rounded-md bg-muted border">T</kbd> - Show tips
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
									<IconSearch className="h-5 w-5 text-blue-500" />
									<h4 className="font-medium text-sm">Search Patterns</h4>
								</div>
								<div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
									<p>
										• <code className="px-1.5 py-0.5 rounded-md bg-muted border">provider:</code> -
										Filter and browse all providers
									</p>
									<p>
										• <code className="px-1.5 py-0.5 rounded-md bg-muted border">model:</code> -
										Filter and browse available models
									</p>
									<p>
										• <code className="px-1.5 py-0.5 rounded-md bg-muted border">tips:</code> -
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
									<IconTarget className="h-5 w-5 text-green-500" />
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
							className="flex items-center gap-3 group/item"
						>
							<IconSettings className="h-5 w-5 text-gray-500" />
							<div className="flex flex-col flex-1">
								<span>Manage Providers</span>
								<span className="text-xs text-muted-foreground">
									Add, edit, or configure API providers
								</span>
							</div>
							<CommandMenuKbd className="opacity-0 group-aria-selected/item:opacity-100 transition-opacity" aria-label="Press Enter to select">
								<EnterKeyIcon />
							</CommandMenuKbd>
						</CommandItem>
					</CommandGroup>
				</CommandList>
				{/* Simplified Footer */}
				<footer 
					className="text-muted-foreground absolute inset-x-0 bottom-0 z-20 flex h-10 items-center justify-between rounded-b-xl border-t border-t-neutral-100 bg-neutral-50/95 backdrop-blur-sm px-4 text-xs font-medium dark:border-t-neutral-700 dark:bg-neutral-800/95"
					role="status"
					aria-label="Command palette status and shortcuts"
				>
					{/* Left side - Search status or basic info */}
					<div className="flex items-center gap-2 min-w-0 flex-1" role="status" aria-live="polite">
						{searchValue && searchValue.trim() ? (
							<>
								<span className="text-[10px]" aria-hidden="true">🔍</span>
								<span className="truncate font-medium text-foreground text-[11px]">
									{searchValue}
								</span>
								<span className="text-[10px] text-muted-foreground/70">
									({searchResultsCount > 0 ? `${searchResultsCount} results` : "No results"})
								</span>
							</>
						) : (
							<>
								<span className="text-[10px]" aria-hidden="true">📊</span>
								<span className="text-[10px] text-muted-foreground">
									{providers.length} providers, {currentProvider?.availableModels?.length || 0} models
								</span>
							</>
						)}
					</div>

					{/* Center - Quick shortcuts (only when not searching) */}
					{!searchValue && (
						<div className="hidden lg:flex items-center gap-3">
							<div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-help" title="Press P to filter providers">
								<CommandMenuKbd className="h-4 text-[10px]">P</CommandMenuKbd>
								<span className="text-[10px]">Providers</span>
							</div>
							<div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-help" title="Press M to filter models">
								<CommandMenuKbd className="h-4 text-[10px]">M</CommandMenuKbd>
								<span className="text-[10px]">Models</span>
							</div>
							<div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-help" title="Press T to show tips">
								<CommandMenuKbd className="h-4 text-[10px]">T</CommandMenuKbd>
								<span className="text-[10px]">Tips</span>
							</div>
						</div>
					)}

					{/* Right side - Navigation hints */}
					<div className="flex items-center gap-2 shrink-0">
						<CommandMenuKbd className="h-4 text-[10px]" aria-label="Press Escape to close" title="Press Escape to close">ESC</CommandMenuKbd>
					</div>
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
        "inline-flex h-5 items-center justify-center gap-1 rounded border border-border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground select-none pointer-events-none",
        className
      )}
      {...props}
    />
  )
}

function EnterKeyIcon({ className }: { className?: string }) {
  return <IconCornerDownLeft className={cn("h-3 w-3", className)} />
}

function ArrowIcon({ className }: { className?: string }) {
  return <IconArrowRight className={cn("h-3 w-3 text-muted-foreground", className)} />
}
