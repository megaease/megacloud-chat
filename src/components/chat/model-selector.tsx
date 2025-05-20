"use client";

import React, { useEffect } from "react";
import { useApiSettings } from "@/context/api-settings-context";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, ChevronDown, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// Define model interface
interface Model {
	id: string;
	name: string;
}

interface ModelSelectorProps {
	className?: string;
}

export function ModelSelector({ className }: ModelSelectorProps) {
	const {
		apiKey,
		baseUrl,
		modelName,
		setModelName,
		saveSettings,
		isConfigured,
	} = useApiSettings();

	// Request available models
	const {
		data: modelsData,
		isLoading: isLoadingModels,
		error: modelsError,
	} = useQuery({
		queryKey: ["models", apiKey, baseUrl],
		queryFn: async () => {
			if (!apiKey || !baseUrl || !isConfigured) {
				return { models: [] };
			}

			const response = await fetch("/api/models/list", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					apiKey,
					baseUrl,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.error || `Error ${response.status}: ${response.statusText}`,
				);
			}

			return response.json();
		},
		enabled: !!apiKey && !!baseUrl && isConfigured,
		retry: 1,
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
		refetchOnWindowFocus: false,
	});

	const availableModels = React.useMemo<Model[]>(() => {
		return (modelsData?.models || []).map((id: string) => ({
			id,
			name: id,
		}));
	}, [modelsData?.models]);

	// Calculate the currently selected model
	const currentModel = React.useMemo(() => {
		if (availableModels.length === 0) return null;
		return (
			availableModels.find((model) => model.id === modelName) ||
			availableModels[0]
		);
	}, [availableModels, modelName]);

	// Set default model if needed
	useEffect(() => {
		// If no model name is configured but models are available, select the first available model
		if (availableModels.length > 0 && !modelName) {
			const defaultModel = availableModels[0];
			if (defaultModel) {
				setModelName(defaultModel.id);
				saveSettings({ modelName: defaultModel.id });
			}
		}
	}, [availableModels, modelName, setModelName, saveSettings]);

	return (
		<div className={cn("flex items-center z-10", className)}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						disabled={
							isLoadingModels || (!isConfigured && availableModels.length === 0)
						}
					>
						{currentModel ? (
							<span className="flex items-center gap-2">
								<span className="max-w-[300px] truncate font-medium">
									{currentModel.name}
								</span>
								<ChevronDown className="h-4 w-4 opacity-50" />
							</span>
						) : isLoadingModels ? (
							<span className="flex items-center gap-2">
								<Loader2 className="h-4 w-4 animate-spin" />
								<span>Loading</span>
								<ChevronDown className="h-4 w-4 opacity-50" />
							</span>
						) : !isConfigured ? (
							<span className="flex items-center gap-2">
								<Settings className="h-4 w-4" />
								<span>Configure API</span>
								<ChevronDown className="h-4 w-4 opacity-50" />
							</span>
						) : (
							<span className="flex items-center gap-2">
								<Settings className="h-4 w-4" />
								<span>Select model</span>
								<ChevronDown className="h-4 w-4 opacity-50" />
							</span>
						)}
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align="start" className="w-64 p-2 rounded-md">
					{availableModels.length > 0 ? (
						<>
							<div className="mb-1.5 px-2 py-1.5 text-sm font-medium text-muted-foreground">
								Select model
							</div>
							{availableModels.map((model) => (
								<DropdownMenuItem
									key={model.id}
									onClick={() => {
										setModelName(model.id);
										saveSettings({ modelName: model.id });
									}}
									className="flex items-center gap-2 rounded-md py-2 my-0.5 focus:bg-accent hover:bg-accent/80 cursor-pointer"
								>
									<span className="flex items-center gap-2 w-full">
										<span className="truncate font-medium">{model.name}</span>
										{model.id === modelName && (
											<span className="ml-auto">
												<div className="h-2.5 w-2.5 rounded-full bg-primary" />
											</span>
										)}
									</span>
								</DropdownMenuItem>
							))}
						</>
					) : isLoadingModels ? (
						<DropdownMenuItem disabled className="text-muted-foreground py-2.5">
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							Loading...
						</DropdownMenuItem>
					) : !isConfigured ? (
						<DropdownMenuItem disabled className="text-muted-foreground py-2.5">
							Please configure API first
						</DropdownMenuItem>
					) : (
						<DropdownMenuItem disabled className="text-muted-foreground py-2.5">
							No models available
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
