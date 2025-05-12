"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";

interface ApiSettingsContextType {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	apiKey: string;
	setApiKey: (apiKey: string) => void;
	modelName: string;
	setModelName: (modelName: string) => void;
	baseUrl: string;
	setBaseUrl: (baseUrl: string) => void;
	saveSettings: () => void;
	isConfigured: boolean;
}

const ApiSettingsContext = createContext<ApiSettingsContextType | undefined>(
	undefined,
);

export function ApiSettingsProvider({ children }: { children: ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);
	const [apiKey, setApiKey] = useState("");
	const [modelName, setModelName] = useState("");
	const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
	const [isConfigured, setIsConfigured] = useState(false);

	// Load settings from localStorage on mount
	useEffect(() => {
		const storedApiKey = localStorage.getItem("aiChatBox_apiKey");
		const storedModelName = localStorage.getItem("aiChatBox_modelName");
		const storedBaseUrl = localStorage.getItem("aiChatBox_baseUrl");

		if (storedApiKey) setApiKey(storedApiKey);
		if (storedModelName) setModelName(storedModelName);
		if (storedBaseUrl) setBaseUrl(storedBaseUrl);
		else setBaseUrl("https://api.openai.com/v1"); // Default to OpenAI if not set

		setIsConfigured(!!(storedApiKey && storedModelName));

		// If not configured, show the modal
		if (!storedApiKey || !storedModelName) {
			setIsOpen(true);
		}
	}, []);

	const saveSettings = () => {
		localStorage.setItem("aiChatBox_apiKey", apiKey);
		localStorage.setItem("aiChatBox_modelName", modelName);
		localStorage.setItem("aiChatBox_baseUrl", baseUrl);
		setIsConfigured(!!(apiKey && modelName));
	};

	return (
		<ApiSettingsContext.Provider
			value={{
				isOpen,
				setIsOpen,
				apiKey,
				setApiKey,
				modelName,
				setModelName,
				baseUrl,
				setBaseUrl,
				saveSettings,
				isConfigured,
			}}
		>
			{children}
		</ApiSettingsContext.Provider>
	);
}

export function useApiSettings() {
	const context = useContext(ApiSettingsContext);
	if (context === undefined) {
		throw new Error(
			"useApiSettings must be used within an ApiSettingsProvider",
		);
	}
	return context;
}
