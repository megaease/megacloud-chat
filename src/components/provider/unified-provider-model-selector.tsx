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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
	const [searchQuery, setSearchQuery] = useState("");
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	// Current selection display text
	const currentSelection = useMemo(() => {
		if (!currentProvider) {
			return "Set API Provider";
		}
		return `${currentProvider.name} / ${currentModel || "Select Model"}`;
	}, [currentProvider, currentModel]);

	// Filter models based on search query
	const filteredModels = useMemo(() => {
		if (!currentProvider?.availableModels?.length) return [];
		if (!searchQuery.trim()) return currentProvider.availableModels;

		return currentProvider.availableModels.filter((model) =>
			model.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [currentProvider, searchQuery]);

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
		<div className="relative" ref={dropdownRef}>
			<Button
				variant="outline"
				className={cn(
					"justify-between gap-2 transition-all duration-200 hover:shadow-sm",
					mobile ? "w-full text-xs h-8" : "w-full h-10",
					isOpen && "ring-2 ring-ring ring-offset-2",
					className,
				)}
				onClick={() => setIsOpen(!isOpen)}
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
				<ChevronDown
					className={cn(
						"h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
						isOpen && "rotate-180",
					)}
				/>
			</Button>

			{isOpen && (
				<div className="absolute z-50 mt-2 w-[min(800px,calc(100vw-2rem))] rounded-lg border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
					<div className="flex h-[400px] rounded-lg overflow-hidden">
						{/* Provider List */}
						<div className="w-1/3 border-r bg-muted/30 min-w-[200px]">
							<div className="p-3 border-b bg-background/50">
								<h3 className="text-sm font-medium text-foreground">
									API Providers
								</h3>
								<p className="text-xs text-muted-foreground mt-0.5">
									Choose your AI service provider
								</p>
							</div>
							<ScrollArea className="h-[calc(400px-60px)]">
								<div className="p-1">
									{providers.map((provider) => {
										const typeInfo = getProviderTypeInfo(provider.providerType);
										const isSelected = currentProvider.id === provider.id;

										return (
											<Button
												key={provider.id}
												variant="ghost"
												className={cn(
													"flex h-auto w-full items-center justify-between rounded-md p-3 mb-1 hover:bg-accent/80 transition-all duration-150",
													isSelected && "bg-accent border border-border",
												)}
												onClick={() => {
													switchProvider(provider.id);
													switchModel("");
												}}
											>
												<div className="flex items-center gap-2 flex-1 text-left min-w-0">
													<div
														className={cn(
															"flex items-center gap-1",
															typeInfo.color,
														)}
													>
														{typeInfo.icon}
													</div>
													<div className="flex flex-col min-w-0 flex-1">
														<span className="font-medium truncate text-sm">
															{provider.name}
														</span>
														<span className="text-xs text-muted-foreground">
															{typeInfo.name}
														</span>
													</div>
												</div>
												{isSelected && (
													<Check className="h-4 w-4 text-primary shrink-0" />
												)}
											</Button>
										);
									})}
								</div>
							</ScrollArea>
						</div>

						{/* Model List */}
						<div className="w-2/3 min-w-[300px]">
							<div className="p-3 border-b bg-background/50">
								<h3 className="text-sm font-medium text-foreground">
									Available Models
								</h3>
								<p className="text-xs text-muted-foreground mt-0.5">
									Model list for {currentProvider.name}
								</p>
								<div className="relative mt-2">
									<Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										placeholder="Search models..."
										className="pl-8 h-8 text-xs"
										onChange={(e) => setSearchQuery(e.target.value)}
									/>
								</div>
							</div>
							<ScrollArea className="h-[300px]">
								{currentProvider?.availableModels?.length ? (
									<div className="p-1">
										{filteredModels.length > 0 ? (
											filteredModels.map((model) => {
												const isSelected = currentModel === model;

												return (
													<Button
														key={model}
														variant="ghost"
														className={cn(
															"flex h-auto w-full items-center justify-between rounded-md p-3 mb-1 hover:bg-accent/80 transition-all duration-150",
															isSelected && "bg-accent border border-border",
														)}
														onClick={() => {
															switchModel(model);
															setIsOpen(false);
														}}
													>
														<div className="flex items-center gap-2 flex-1 text-left min-w-0">
															<div className="flex flex-col min-w-0 flex-1">
																<span className="font-medium truncate text-sm">
																	{model}
																</span>
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
														</div>
														{isSelected && (
															<Check className="h-4 w-4 text-primary shrink-0" />
														)}
													</Button>
												);
											})
										) : (
											<div className="flex flex-col items-center justify-center h-full p-6 text-center">
												<div className="rounded-full bg-muted p-3 mb-3">
													<Search className="h-6 w-6 text-muted-foreground" />
												</div>
												<p className="text-sm font-medium text-foreground mb-1">
													No Matching Models
												</p>
												<p className="text-xs text-muted-foreground">
													Try a different search term
												</p>
											</div>
										)}
									</div>
								) : (
									<div className="flex flex-col items-center justify-center h-full p-6 text-center">
										<div className="rounded-full bg-muted p-3 mb-3">
											<Cpu className="h-6 w-6 text-muted-foreground" />
										</div>
										<p className="text-sm font-medium text-foreground mb-1">
											No Available Models
										</p>
										<p className="text-xs text-muted-foreground">
											Please check provider configuration or contact
											administrator
										</p>
									</div>
								)}
							</ScrollArea>
						</div>
					</div>

					{/* Bottom Action Area */}
					<div className="border-t bg-background/50 p-2">
						<Button
							variant="ghost"
							className="w-full justify-start gap-2 h-9 hover:bg-accent/80 transition-colors duration-150"
							onClick={() => {
								setProviderModalOpen(true);
								setIsOpen(false);
							}}
						>
							<Settings className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm">Manage Providers</span>
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
