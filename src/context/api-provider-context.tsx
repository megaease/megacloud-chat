"use client";

import type { ProviderType } from "@/lib/ai-providers";
import type { ApiProvider } from "@/types/api-provider";
import {
	QueryClient,
	QueryClientProvider,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { toast } from "sonner";

export interface ApiProviderContextType {
	// State
	providers: ApiProvider[];
	currentProvider: ApiProvider | null;
	currentModel: string;
	isConfigured: boolean;
	isLoading: boolean;

	// Provider management dialog
	isProviderModalOpen: boolean;
	setProviderModalOpen: (isOpen: boolean) => void;

	// Provider management functions
	addProvider: (provider: {
		name: string;
		providerType: ProviderType;
		apiKey: string;
		baseUrl: string;
		availableModels?: string[];
	}) => Promise<ApiProvider>;
	updateProvider: (
		id: string,
		updates: Partial<ApiProvider>,
	) => Promise<ApiProvider>;
	deleteProvider: (id: string) => Promise<boolean>;
	setDefaultProvider: (id: string) => Promise<ApiProvider>;

	// Provider switching
	switchProvider: (id: string) => Promise<void>;
	switchModel: (modelName: string) => Promise<void>;

	// Connection testing
	testConnection: (params: {
		apiKey: string;
		baseUrl: string;
		providerType: ProviderType;
	}) => Promise<string[]>;
}

const ApiProviderContext = createContext<ApiProviderContextType | null>(null);

// User ID for development environment simulation
const TEST_USER_ID = "user-id";

// API request functions
const fetchProviders = async (): Promise<ApiProvider[]> => {
	const response = await fetch(`/api/providers?userId=${TEST_USER_ID}`);
	if (!response.ok) {
		throw new Error(`Failed to load providers: ${response.status}`);
	}
	const data = await response.json();
	return data.providers as ApiProvider[];
};

const addNewProvider = async (provider: {
	name: string;
	providerType: ProviderType;
	apiKey: string;
	baseUrl: string;
	availableModels?: string[];
}): Promise<ApiProvider> => {
	const response = await fetch("/api/providers", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			...provider,
			userId: TEST_USER_ID,
		}),
	});

	if (!response.ok) {
		try {
			const error = await response.json();
			throw new Error(error.error || "Failed to add provider");
		} catch (jsonError) {
			throw new Error(
				`Failed to add provider: ${response.status} ${response.statusText}`,
			);
		}
	}

	try {
		const data = await response.json();
		return data.provider as ApiProvider;
	} catch (jsonError) {
		throw new Error("Failed to parse server response when adding provider");
	}
};

const updateExistingProvider = async ({
	id,
	updates,
}: {
	id: string;
	updates: Partial<ApiProvider>;
}): Promise<ApiProvider> => {
	const response = await fetch(`/api/providers/${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(updates),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to update provider");
	}

	const data = await response.json();
	return data.provider as ApiProvider;
};

const deleteExistingProvider = async (id: string): Promise<boolean> => {
	const response = await fetch(`/api/providers/${id}`, {
		method: "DELETE",
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to delete provider");
	}

	return true;
};

const setProviderAsDefault = async (id: string): Promise<ApiProvider> => {
	const response = await fetch(`/api/providers/${id}/default`, {
		method: "PUT",
	});

	if (!response.ok) {
		try {
			const error = await response.json();
			throw new Error(error.error || "Failed to set default provider");
		} catch (jsonError) {
			// Handle case where the response is not valid JSON
			throw new Error(
				`Failed to set default provider: ${response.status} ${response.statusText}`,
			);
		}
	}

	try {
		const data = await response.json();
		return data.provider as ApiProvider;
	} catch (jsonError) {
		// Handle case where the response is not valid JSON
		throw new Error(
			"Failed to parse server response when setting default provider",
		);
	}
};

const testProviderConnection = async (params: {
	apiKey: string;
	baseUrl: string;
	providerType: ProviderType;
}): Promise<string[]> => {
	const response = await fetch("/api/providers/test-connection", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(params),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to test connection");
	}

	const data = await response.json();
	return data.models as string[];
};

// Create a client instance that can be used in server components
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60, // 1 minute
			refetchOnWindowFocus: false,
		},
	},
});

// API Provider Context wrapper, sets up React Query
export function ApiProviderWrapper({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<ApiProviderProvider>{children}</ApiProviderProvider>
		</QueryClientProvider>
	);
}

/**
 * API Provider Context Provider Component
 */
function ApiProviderProvider({ children }: { children: ReactNode }) {
	const queryClient = useQueryClient();
	// 初始化时先尝试从 localStorage 获取上次选择的提供者 ID
	const [savedProviderId, setSavedProviderId] = useState<string | null>(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("currentProviderId");
		}
		return null;
	});

	const [currentProvider, setCurrentProvider] = useState<ApiProvider | null>(
		null,
	);
	const [currentModel, setCurrentModel] = useState<string>(() => {
		if (typeof window !== "undefined") {
			const savedModel = localStorage.getItem("currentModel");
			return savedModel || "";
		}
		return "";
	});
	const [isProviderModalOpen, setIsProviderModalOpen] =
		useState<boolean>(false);

	// Query all providers
	const {
		data: providers = [] as ApiProvider[],
		isLoading,
		isError,
		error,
	} = useQuery<ApiProvider[], Error>({
		queryKey: ["providers"],
		queryFn: fetchProviders,
	});

	const addProviderMutation = useMutation<
		ApiProvider,
		Error,
		{
			name: string;
			providerType: ProviderType;
			apiKey: string;
			baseUrl: string;
			availableModels?: string[];
		}
	>({
		mutationFn: addNewProvider,
		onSuccess: (newProvider) => {
			// Refresh provider list
			queryClient.invalidateQueries({ queryKey: ["providers"] });

			// If this is the first provider, set it as the current provider
			if (providers.length === 0) {
				setCurrentProvider(newProvider);
				if (newProvider.lastModelUsed) {
					setCurrentModel(newProvider.lastModelUsed);
				} else if (newProvider.availableModels?.length > 0) {
					setCurrentModel(newProvider.availableModels[0] || "");
				}
			}
		},
		onError: (error) => {
			toast.error("Failed to add provider", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		},
	});

	// Update provider
	const updateProviderMutation = useMutation<
		ApiProvider,
		Error,
		{
			id: string;
			updates: Partial<ApiProvider>;
		}
	>({
		mutationFn: updateExistingProvider,
		onSuccess: (updatedProvider) => {
			// Refresh provider list
			queryClient.invalidateQueries({ queryKey: ["providers"] });

			// If updating the current provider, also update currentProvider state
			if (currentProvider?.id === updatedProvider.id) {
				setCurrentProvider((prev) =>
					prev ? { ...prev, ...updatedProvider } : prev,
				);
			}
		},
		onError: (error) => {
			toast.error("Failed to update provider", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		},
	});

	// Delete provider
	const deleteProviderMutation = useMutation<boolean, Error, string>({
		mutationFn: deleteExistingProvider,
		onSuccess: (_, id) => {
			// Refresh provider list
			queryClient.invalidateQueries({ queryKey: ["providers"] });

			// If the deleted provider was the current one, switch to another provider
			if (currentProvider?.id === id) {
				const nextProvider = providers.find((p) => p.id !== id);
				if (nextProvider) {
					setCurrentProvider(nextProvider);
					if (nextProvider.lastModelUsed) {
						setCurrentModel(nextProvider.lastModelUsed);
					} else if (nextProvider.availableModels?.length > 0) {
						setCurrentModel(nextProvider.availableModels[0] || "");
					} else {
						setCurrentModel("");
					}
				} else {
					setCurrentProvider(null);
					setCurrentModel("");
				}
			}
		},
		onError: (error) => {
			toast.error("Failed to delete provider", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		},
	});

	// Set default provider
	const setDefaultProviderMutation = useMutation<ApiProvider, Error, string>({
		mutationFn: setProviderAsDefault,
		onSuccess: () => {
			// Refresh provider list
			queryClient.invalidateQueries({ queryKey: ["providers"] });
			toast.success("Default provider set successfully");
		},
		onError: (error) => {
			toast.error("Failed to set default provider", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		},
	});

	// Test connection
	const testConnectionMutation = useMutation<
		string[],
		Error,
		{
			apiKey: string;
			baseUrl: string;
			providerType: ProviderType;
		}
	>({
		mutationFn: testProviderConnection,
	});

	// Initialize: Set default provider
	useEffect(() => {
		if (providers.length > 0 && !currentProvider) {
			// 第一优先级：使用 localStorage 中保存的 providerId
			if (savedProviderId) {
				const savedProvider = providers.find((p) => p.id === savedProviderId);
				if (savedProvider) {
					setCurrentProvider(savedProvider);
					// 如果 localStorage 中也有保存的模型，优先使用该模型
					const savedModel = localStorage.getItem("currentModel");
					if (savedModel) {
						setCurrentModel(savedModel);
						return; // 成功恢复用户上次的选择，直接返回
					}
					if (savedProvider.lastModelUsed) {
						setCurrentModel(savedProvider.lastModelUsed);
						return;
					}
					if (savedProvider.availableModels?.length > 0) {
						setCurrentModel(savedProvider.availableModels[0] || "");
						return;
					}
				}
			}

			// 第二优先级：使用默认提供者
			const defaultProvider = providers.find((p) => p.isDefault);
			if (defaultProvider) {
				setCurrentProvider(defaultProvider);
				if (defaultProvider.lastModelUsed) {
					setCurrentModel(defaultProvider.lastModelUsed);
				} else if (defaultProvider.availableModels?.length > 0) {
					setCurrentModel(defaultProvider.availableModels[0] || "");
				}
			} else {
				// 第三优先级：使用第一个提供者
				const firstProvider = providers[0] as ApiProvider;
				setCurrentProvider(firstProvider ?? null);
				if (firstProvider?.lastModelUsed) {
					setCurrentModel(firstProvider.lastModelUsed);
				} else if (firstProvider.availableModels?.length > 0) {
					setCurrentModel(firstProvider?.availableModels[0] || "");
				}
			}
		}
	}, [providers, currentProvider, savedProviderId]);

	// Switch provider
	const switchProvider = useCallback(
		async (id: string) => {
			const provider = providers.find((p) => p.id === id);
			if (!provider) {
				toast.error("Provider does not exist");
				return;
			}

			setCurrentProvider(provider);

			// Set previously used model
			if (provider.lastModelUsed) {
				setCurrentModel(provider.lastModelUsed);
			} else if (provider.availableModels?.length > 0) {
				setCurrentModel(provider.availableModels[0] || "");
			} else {
				setCurrentModel("");
			}
		},
		[providers],
	);

	// Switch model
	const switchModel = useCallback(
		async (modelName: string) => {
			setCurrentModel(modelName);

			// 保存当前模型到 localStorage，使其在页面刷新后能够持久保留
			if (typeof window !== "undefined") {
				localStorage.setItem("currentModel", modelName);
				// 同时也保存当前 provider 的 ID，确保重新加载时能够恢复正确的 provider
				if (currentProvider) {
					localStorage.setItem("currentProviderId", currentProvider.id);
				}
			}

			// Update provider's last used model
			if (currentProvider) {
				updateProviderMutation.mutate({
					id: currentProvider.id,
					updates: { lastModelUsed: modelName },
				});
			}
		},
		[currentProvider, updateProviderMutation],
	);

	// Wrap mutations as public API
	const addProvider = useCallback(
		async (provider: {
			name: string;
			providerType: ProviderType;
			apiKey: string;
			baseUrl: string;
			availableModels?: string[];
		}) => {
			return addProviderMutation.mutateAsync(provider);
		},
		[addProviderMutation],
	);

	const updateProvider = useCallback(
		async (id: string, updates: Partial<ApiProvider>) => {
			const result = await updateProviderMutation.mutateAsync({ id, updates });
			return result;
		},
		[updateProviderMutation],
	);

	const deleteProvider = useCallback(
		async (id: string) => {
			const success = await deleteProviderMutation.mutateAsync(id);
			return success;
		},
		[deleteProviderMutation],
	);

	const setDefaultProvider = useCallback(
		async (id: string) => {
			const provider = await setDefaultProviderMutation.mutateAsync(id);
			return provider;
		},
		[setDefaultProviderMutation],
	);

	const testConnection = useCallback(
		async (params: {
			apiKey: string;
			baseUrl: string;
			providerType: ProviderType;
		}) => {
			const models = await testConnectionMutation.mutateAsync(params);
			return models;
		},
		[testConnectionMutation],
	);

	// Calculate if configured
	const isConfigured = providers.length > 0 && currentProvider !== null;

	// Context value
	const value: ApiProviderContextType = {
		providers,
		currentProvider,
		currentModel,
		isConfigured,
		isLoading,
		isProviderModalOpen,
		setProviderModalOpen: setIsProviderModalOpen,
		addProvider,
		updateProvider,
		deleteProvider,
		setDefaultProvider,
		switchProvider,
		switchModel,
		testConnection,
	};

	return (
		<ApiProviderContext.Provider value={value}>
			{children}
		</ApiProviderContext.Provider>
	);
}

/**
 * Hook for the API Provider Context
 */
export function useApiProvider() {
	const context = useContext(ApiProviderContext);

	if (!context) {
		throw new Error(
			"useApiProvider must be used within an ApiProviderProvider",
		);
	}

	return context;
}
