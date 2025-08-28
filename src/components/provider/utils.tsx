import {
	IconBolt,
	IconBrain,
	IconCpu,
	IconGlobe,
	IconSettings,
	IconShield,
} from "@tabler/icons-react";

export const getProviderTypeInfo = (type: string) => {
	const types: Record<
		string,
		{ name: string; icon: React.ReactNode; color: string }
	> = {
		openai: {
			name: "OpenAI",
			icon: <IconBolt className="h-4 w-4" />,
			color: "text-green-600 dark:text-green-400",
		},
		deepseek: {
			name: "DeepSeek",
			icon: <IconCpu className="h-4 w-4" />,
			color: "text-blue-600 dark:text-blue-400",
		},
		openrouter: {
			name: "OpenRouter",
			icon: <IconShield className="h-4 w-4" />,
			color: "text-yellow-600 dark:text-yellow-400",
		},
		anthropic: {
			name: "Anthropic",
			icon: <IconBrain className="h-4 w-4" />,
			color: "text-orange-600 dark:text-orange-400",
		},
		custom: {
			name: "Custom",
			icon: <IconSettings className="h-4 w-4" />,
			color: "text-purple-600 dark:text-purple-400",
		},
	};
	return (
		types[type] || {
			name: type,
			icon: <IconGlobe className="h-4 w-4" />,
			color: "text-gray-600 dark:text-gray-400",
		}
	);
};
