import {
	CommandGroup,
	CommandItem,
	CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { ApiProvider } from "@/types/api-provider";
// components/ProvidersSection.tsx
import { useMemo } from "react";
import { getProviderTypeInfo } from "../utils";
import { CommandMenuKbd, EnterKeyIcon } from "./shared";

interface ProvidersSectionProps {
	providers: ApiProvider[];
	currentProvider: ApiProvider | null;
	onProviderSelect: (providerId: string) => void;
	onAutoShowModels: () => void;
}

export function ProvidersSection({
	providers,
	currentProvider,
	onProviderSelect,
	onAutoShowModels,
}: ProvidersSectionProps) {
	// Group providers by type
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

	return (
		<>
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
											onProviderSelect(provider.id);
											onAutoShowModels();
										}
									}}
									className="flex items-center gap-3 group/item"
								>
									<div
										className={cn("flex items-center gap-1", typeInfo.color)}
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
										<CommandMenuKbd
											className="opacity-0 group-aria-selected/item:opacity-100 transition-opacity"
											aria-label="Press Enter to select"
										>
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
		</>
	);
}
