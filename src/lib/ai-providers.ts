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
	if (!url) return true; // 默认认为是 OpenAI
	return url.includes("openai") || url.includes("api.openai");
}

/**
 * 创建 AI 模型配置的统一抽象层
 * @param providerType 提供商类型
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
			const customOpenAI = createOpenAI({
				baseURL: baseUrl || "https://api.openai.com/v1",
				apiKey: apiKey,
				compatibility: "strict",
			});
			return customOpenAI(modelName);
		}

		case "deepseek": {
			const deepseek = createDeepSeek({
				apiKey: apiKey || "",
				baseURL: baseUrl || "https://api.deepseek.com",
			});
			return deepseek(modelName);
		}

		case "openrouter": {
			const openRouter = createOpenRouter({
				apiKey: apiKey || "",
				baseURL: baseUrl || "https://api.openrouter.ai/v1",
			});
			return openRouter(modelName || "gpt-4-turbo");
		}

		case "custom": {
			const compatibleAI = createOpenAI({
				baseURL: baseUrl || "https://api.openai.com/v1",
				apiKey: apiKey || "",
				compatibility: "compatible",
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
