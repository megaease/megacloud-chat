import { openai, createOpenAI } from "@ai-sdk/openai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
export type ProviderType = "openai" | "deepseek" | "openrouter" | "custom";

interface ProviderConfig {
	apiKey?: string;
	baseUrl?: string;
	modelName: string;
}

export function isOpenAI(url: string): boolean {
	if (!url) return true; // Default to OpenAI
	return url.includes("openai") || url.includes("api.openai");
}

/**
 * Create unified abstraction layer for AI model configuration
 * @param providerType Provider type
 * @param config 配置参数
 * @returns 配置好的 AI 模型
 */
export function createAIModelConfig(
	providerType: ProviderType,
	config: ProviderConfig,
) {
	const { apiKey, baseUrl, modelName } = config;

	switch (providerType) {
		case "openai": {
			console.log("Creating AI model for provider:", "openai");
			const customOpenAI = createOpenAI({
				baseURL: baseUrl || "https://api.openai.com/v1",
				apiKey: apiKey,
				compatibility: "strict",
			});
			return customOpenAI(modelName);
		}

		case "deepseek": {
			// 如果 baseUrl 不是官方 DeepSeek API，使用 OpenAI 兼容模式
			if (baseUrl && !baseUrl.includes("api.deepseek.com")) {
				const compatibleAI = createOpenAI({
					baseURL: baseUrl,
					apiKey: apiKey || "",
					compatibility: "compatible",
				});
				return compatibleAI(modelName);
			}

			const deepseek = createDeepSeek({
				apiKey: apiKey || "",
				baseURL: baseUrl || "https://api.deepseek.com",
			});
			return deepseek(modelName);
		}

		case "openrouter": {
			const openRouter = createOpenRouter({
				apiKey: apiKey || "",
				baseURL: baseUrl || "https://openrouter.ai/api/v1",
				extraBody: {
					reasoning: {
						max_tokens: 10,
					},
				},
			});
			return openRouter(modelName || "openai/gpt-4o-mini"); // 修正模型名称
		}

		case "custom": {
			const compatibleAI = createOpenAI({
				baseURL: baseUrl || "https://api.openai.com/v1",
				apiKey: apiKey || "",
				compatibility: "compatible", // 使用 compatible 模式处理不严格的响应格式
			});
			return compatibleAI(modelName);
		}

		default: {
			return openai(modelName || "gpt-4-turbo", {
				structuredOutputs: true,
			});
		}
	}
}

/**
 * 根据提供的配置自动检测并创建合适的 AI 模型
 * @param config 用户提供的配置
 * @returns 配置好的 AI 模型和推断出的提供商类型
 */
export function detectAndCreateAIModel(config: {
	apiKey?: string;
	modelName?: string;
	baseUrl?: string;
	providerType?: string;
}) {
	const { apiKey, modelName, baseUrl, providerType } = config;

	if (providerType) {
		return {
			model: createAIModelConfig(providerType as ProviderType, {
				apiKey,
				baseUrl,
				modelName: modelName || "gpt-4-turbo",
			}),
			detectedProvider: providerType,
		};
	}

	let detectedProvider: ProviderType = "openai"; // 默认为 OpenAI

	if (baseUrl) {
		if (baseUrl.includes("deepseek") || modelName?.includes("deepseek")) {
			detectedProvider = "deepseek";
		} else if (!isOpenAI(baseUrl)) {
			detectedProvider = "custom";
		}
	} else if (modelName) {
		// 根据模型名称推断
		if (modelName.includes("deepseek")) {
			detectedProvider = "deepseek";
		}
	}

	return {
		model: createAIModelConfig(detectedProvider, {
			apiKey,
			baseUrl,
			modelName: modelName || "gpt-4-turbo",
		}),
		detectedProvider,
	};
}

const providerUrlMapping: Record<ProviderType, string> = {
	openai: "https://api.openai.com/v1",
	deepseek: "https://api.deepseek.com",
	openrouter: "https://openrouter.ai/api/v1",
	custom: "https://api.openai.com/v1",
};

export function getDefaultUrlForProvider(providerType: ProviderType): string {
	return providerUrlMapping[providerType] || "";
}

export function isKnownDefaultUrl(url: string): boolean {
	const knownUrls = Object.values(providerUrlMapping);
	return knownUrls.includes(url) || url === "";
}
