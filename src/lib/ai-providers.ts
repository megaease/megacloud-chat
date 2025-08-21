import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createZhipu } from "zhipu-ai-provider";
export type ProviderType =
	| "openai"
	| "deepseek"
	| "openrouter"
	| "anthropic"
	| "glm"
	| "custom";

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
			});
			return customOpenAI(modelName);
		}

		case "anthropic": {
			console.log("Creating AI model for provider:", "anthropic");
			const anthropic = createAnthropic({
				apiKey: apiKey || "",
				baseURL: baseUrl || "https://api.anthropic.com",
			});
			return anthropic(modelName || "claude-3-5-sonnet-20241022");
		}

		case "deepseek": {
			// 如果 baseUrl 不是官方 DeepSeek API，使用 OpenAI 兼容模式
			if (baseUrl && !baseUrl.includes("api.deepseek.com")) {
				const compatibleAI = createOpenAI({
					baseURL: baseUrl,
					apiKey: apiKey || "",
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
					reasoningText: {
						max_tokens: 10,
					},
				},
			});
			return openRouter(modelName || "openai/gpt-4o-mini"); // 修正模型名称
		}

		case "glm": {
			console.log("Creating AI model for provider:", "glm");
			// deepseek provider can handle GLM models
			const glmAI = createDeepSeek({
				apiKey: apiKey || "",
				baseURL: baseUrl || "https://open.bigmodel.cn/api/paas/v4",
			});
			return glmAI(modelName || "glm-4.5-air");
		}

		case "custom": {
			const compatibleAI = createOpenAI({
				baseURL: baseUrl || "https://api.openai.com/v1",
				apiKey: apiKey || "",
			});
			return compatibleAI(modelName);
		}

		default: {
			return openai(modelName || "gpt-4-turbo");
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
		// Use provider-specific default model names
		let defaultModel = "gpt-4-turbo"; // Default for OpenAI
		if (providerType === "deepseek") {
			defaultModel = "deepseek-chat";
		} else if (providerType === "anthropic") {
			defaultModel = "claude-3-5-sonnet-20241022";
		} else if (providerType === "openrouter") {
			defaultModel = "openai/gpt-4o-mini";
		} else if (providerType === "glm") {
			defaultModel = "glm-4.5-air";
		}

		return {
			model: createAIModelConfig(providerType as ProviderType, {
				apiKey,
				baseUrl,
				modelName: modelName || defaultModel,
			}),
			detectedProvider: providerType,
		};
	}

	let detectedProvider: ProviderType = "openai"; // 默认为 OpenAI

	if (baseUrl) {
		if (baseUrl.includes("deepseek") || modelName?.includes("deepseek")) {
			detectedProvider = "deepseek";
		} else if (baseUrl.includes("anthropic") || modelName?.includes("claude")) {
			detectedProvider = "anthropic";
		} else if (baseUrl.includes("openrouter")) {
			detectedProvider = "openrouter";
		} else if (
			baseUrl.includes("bigmodel") ||
			baseUrl.includes("glm") ||
			modelName?.includes("glm")
		) {
			detectedProvider = "glm";
		} else if (!isOpenAI(baseUrl)) {
			detectedProvider = "custom";
		}
	} else if (modelName) {
		// 根据模型名称推断
		if (modelName.includes("deepseek")) {
			detectedProvider = "deepseek";
		} else if (modelName.includes("claude")) {
			detectedProvider = "anthropic";
		} else if (modelName.includes("openrouter")) {
			detectedProvider = "openrouter";
		} else if (modelName.includes("glm")) {
			detectedProvider = "glm";
		}
	}

	// Use provider-specific default model names for auto-detected providers
	let defaultModel = "gpt-4-turbo"; // Default for OpenAI
	if (detectedProvider === "deepseek") {
		defaultModel = "deepseek-chat";
	} else if (detectedProvider === "anthropic") {
		defaultModel = "claude-3-5-sonnet-20241022";
	} else if (detectedProvider === "openrouter") {
		defaultModel = "openai/gpt-4o-mini";
	} else if (detectedProvider === "glm") {
		defaultModel = "glm-4.5-air";
	}

	return {
		model: createAIModelConfig(detectedProvider, {
			apiKey,
			baseUrl,
			modelName: modelName || defaultModel,
		}),
		detectedProvider,
	};
}

const providerUrlMapping: Record<ProviderType, string> = {
	openai: "https://api.openai.com/v1",
	deepseek: "https://api.deepseek.com",
	openrouter: "https://openrouter.ai/api/v1",
	anthropic: "https://api.anthropic.com",
	glm: "https://open.bigmodel.cn/api/paas/v4",
	custom: "https://api.openai.com/v1",
};

export function getDefaultUrlForProvider(providerType: ProviderType): string {
	return providerUrlMapping[providerType] || "";
}

export function isKnownDefaultUrl(url: string): boolean {
	const knownUrls = Object.values(providerUrlMapping);
	return knownUrls.includes(url) || url === "";
}
