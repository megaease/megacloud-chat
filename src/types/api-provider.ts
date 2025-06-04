import type { ProviderType } from "@/lib/ai-providers";

export interface ApiProvider {
	id: string;
	name: string;
	providerType: ProviderType;
	apiKey: string;
	baseUrl: string;
	isDefault: boolean;
	userId: string;
	availableModels: string[];
	lastModelUsed?: string;
	lastTestedAt?: Date | null;
	lastTestSuccess?: boolean | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateApiProviderData {
	name: string;
	providerType: ProviderType;
	apiKey: string;
	baseUrl: string;
	userId: string;
	availableModels?: string[];
}

export interface UpdateApiProviderData {
	name?: string;
	providerType?: ProviderType;
	apiKey?: string;
	baseUrl?: string;
	availableModels?: string[];
	lastModelUsed?: string;
}
