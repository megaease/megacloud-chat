"use client";

import type React from "react";

import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Settings,
	ChevronDown,
	Check,
	Zap,
	Globe,
	Cpu,
	Search,
	Pin,
} from "lucide-react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
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
						// Use a more comprehensive approach to trigger React's input handler
						const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
							window.HTMLInputElement.prototype,
							"value",
						)?.set;
						if (nativeInputValueSetter) {
							nativeInputValueSetter.call(input, "provider:");
							// Dispatch a more complete InputEvent with all necessary properties
							input.dispatchEvent(
								new InputEvent("input", {
									bubbles: true,
									cancelable: true,
									inputType: "insertText",
									data: "provider:",
									composed: true,
								}),
							);
							// Also trigger change event as backup
							input.dispatchEvent(new Event("change", { bubbles: true }));
						}
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
						// Use a more comprehensive approach to trigger React's input handler
						const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
							window.HTMLInputElement.prototype,
							"value",
						)?.set;
						if (nativeInputValueSetter) {
							nativeInputValueSetter.call(input, "model:");
							// Dispatch a more complete InputEvent with all necessary properties
							input.dispatchEvent(
								new InputEvent("input", {
									bubbles: true,
									cancelable: true,
									inputType: "insertText",
									data: "model:",
									composed: true,
								}),
							);
							// Also trigger change event as backup
							input.dispatchEvent(new Event("change", { bubbles: true }));
						}
					}
				}

				if (e.key === "t" && !e.metaKey && !e.ctrlKey && !e.altKey) {
					const input = document.querySelector(
						"[cmdk-input]",
					) as HTMLInputElement;
					if (input && document.activeElement === input && input.value === "") {
						e.preventDefault();
						// Use a more comprehensive approach to trigger React's input handler
						const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
							window.HTMLInputElement.prototype,
							"value",
						)?.set;
						if (nativeInputValueSetter) {
							nativeInputValueSetter.call(input, "tips:");
							// Dispatch a more complete InputEvent with all necessary properties
							input.dispatchEvent(
								new InputEvent("input", {
									bubbles: true,
									cancelable: true,
									inputType: "insertText",
									data: "tips:",
									composed: true,
								}),
							);
							// Also trigger change event as backup
							input.dispatchEvent(new Event("change", { bubbles: true }));
						}
					}
				}
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [isOpen, currentProvider?.availableModels?.length]);

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
				<Settings className="h-4 w-4 text-muted-foreground" />
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
					<ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
					<kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 group-hover:bg-muted-foreground/10 transition-colors">
						<span className="text-xs">⌘</span>K
					</kbd>
				</div>
			</Button>

			<CommandDialog open={isOpen} onOpenChange={setIsOpen}>
				<CommandInput placeholder="Search providers & models..." autoFocus />
				<CommandList>
					<CommandEmpty>
						<div className="flex flex-col items-center gap-3 py-8 text-center">
							<Search className="h-10 w-10 text-muted-foreground" />
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
							<Globe className="h-4 w-4 text-blue-500" />
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
								<Cpu className="h-4 w-4 text-purple-500" />
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
							<Zap className="h-4 w-4 text-orange-500" />
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
											{isSelected && <Check className="h-4 w-4" />}
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
									<Zap className="h-4 w-4 text-yellow-500" />
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
									<Search className="h-4 w-4 text-blue-500" />
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
									<Globe className="h-4 w-4 text-green-500" />
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
							<Settings className="h-4 w-4 text-gray-500" />
							<div className="flex flex-col flex-1">
								<span>Manage Providers</span>
								<span className="text-xs text-muted-foreground">
									Add, edit, or configure API providers
								</span>
							</div>
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</CommandDialog>
		</>
	);
}
