import { Cpu, Globe, Settings, Shield, Zap } from "lucide-react";

export const getProviderTypeInfo = (type: string) => {
	const types: Record<
		string,
		{ name: string; icon: React.ReactNode; color: string }
	> = {
		openai: {
			name: "OpenAI",
			icon: <Zap className="h-4 w-4" />,
			color: "text-green-600 dark:text-green-400",
		},
		deepseek: {
			name: "DeepSeek",
			icon: <Cpu className="h-4 w-4" />,
			color: "text-blue-600 dark:text-blue-400",
		},
		openrouter: {
			name: "OpenRouter",
			icon: <Shield className="h-4 w-4" />,
			color: "text-yellow-600 dark:text-yellow-400",
		},
		custom: {
			name: "Custom",
			icon: <Settings className="h-4 w-4" />,
			color: "text-purple-600 dark:text-purple-400",
		},
	};
	return (
		types[type] || {
			name: type,
			icon: <Globe className="h-4 w-4" />,
			color: "text-gray-600",
		}
	);
};
