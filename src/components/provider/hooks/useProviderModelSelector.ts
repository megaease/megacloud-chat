import { useApiProvider } from "@/context/api-provider-context";
// hooks/useProviderModelSelector.ts
import { useCallback, useEffect, useMemo, useState } from "react";

export function useProviderModelSelector() {
	const {
		providers,
		currentProvider,
		currentModel,
		switchProvider,
		switchModel,
		setProviderModalOpen,
	} = useApiProvider();

	const [isOpen, setIsOpen] = useState(false);
	const [selectedValue, setSelectedValue] = useState<string>("");
	const [searchValue, setSearchValue] = useState<string>("");
	const [resultsCount, setResultsCount] = useState<number>(0);

	// Optimized keyboard shortcuts handler
	const handleKeyboardShortcut = useCallback((inputValue: string) => {
		const input = document.querySelector("[cmdk-input]") as HTMLInputElement;
		if (!input) return;

		const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
			window.HTMLInputElement.prototype,
			"value",
		)?.set;

		if (nativeInputValueSetter) {
			nativeInputValueSetter.call(input, inputValue);
			input.dispatchEvent(
				new InputEvent("input", {
					bubbles: true,
					cancelable: true,
					inputType: "insertText",
					data: inputValue,
					composed: true,
				}),
			);
			input.dispatchEvent(new Event("change", { bubbles: true }));
		}
	}, []);

	// Track search results count
	const searchResultsCount = useMemo(() => {
		if (!searchValue.trim()) return 0;

		let count = 0;
		const searchLower = searchValue.toLowerCase().trim();

		// Handle specific prefixes
		if (searchLower === "provider:") return providers.length;
		if (searchLower === "model:")
			return currentProvider?.availableModels?.length || 0;
		if (searchLower === "tips:") return 3;

		// Count matches for different categories
		const quickAccessItems = [
			{
				keywords: ["provider", "browse", "show all providers", "world"],
				condition: true,
			},
			{
				keywords: ["model", "show all models", "cpu"],
				condition: !!currentProvider?.availableModels?.length,
			},
			{
				keywords: ["tip", "help", "quick tips", "usage", "bolt"],
				condition: true,
			},
		];

		for (const item of quickAccessItems) {
			if (
				item.condition &&
				item.keywords.some(
					(keyword) =>
						keyword.includes(searchLower) || searchLower.includes(keyword),
				)
			) {
				count++;
			}
		}

		// Count models and providers
		if (
			!searchLower.includes("provider:") &&
			currentProvider?.availableModels
		) {
			count += currentProvider.availableModels.filter((model) =>
				model.toLowerCase().includes(searchLower),
			).length;
		}

		if (!searchLower.includes("model:")) {
			count += providers.filter(
				(provider) =>
					provider.name.toLowerCase().includes(searchLower) ||
					provider.providerType.toLowerCase().includes(searchLower),
			).length;
		}

		// Tips and management actions
		const tipKeywords = [
			"keyboard",
			"shortcut",
			"search",
			"pattern",
			"workflow",
		];
		if (tipKeywords.some((keyword) => searchLower.includes(keyword))) {
			count += 3;
		}

		if (
			["manage", "setting", "config", "action"].some((keyword) =>
				searchLower.includes(keyword),
			)
		) {
			count++;
		}

		return count;
	}, [searchValue, providers, currentProvider]);

	// Optimized input handler
	const handleSearchChange = useCallback(
		(value: string) => {
			setSearchValue(value);
			setResultsCount(searchResultsCount);
		},
		[searchResultsCount],
	);

	// Keyboard shortcut support
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setIsOpen((open) => !open);
			}

			if (isOpen) {
				const input = document.querySelector(
					"[cmdk-input]",
				) as HTMLInputElement;
				if (!input || document.activeElement !== input || input.value !== "")
					return;

				if (e.key === "p" && !e.metaKey && !e.ctrlKey && !e.altKey) {
					e.preventDefault();
					handleKeyboardShortcut("provider:");
				}

				if (
					e.key === "m" &&
					!e.metaKey &&
					!e.ctrlKey &&
					!e.altKey &&
					currentProvider?.availableModels?.length
				) {
					e.preventDefault();
					handleKeyboardShortcut("model:");
				}

				if (e.key === "t" && !e.metaKey && !e.ctrlKey && !e.altKey) {
					e.preventDefault();
					handleKeyboardShortcut("tips:");
				}
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [
		isOpen,
		currentProvider?.availableModels?.length,
		handleKeyboardShortcut,
	]);

	return {
		// State
		isOpen,
		setIsOpen,
		selectedValue,
		setSelectedValue,
		searchValue,
		searchResultsCount,

		// Handlers
		handleSearchChange,
		handleKeyboardShortcut,

		// Provider data
		providers,
		currentProvider,
		currentModel,
		switchProvider,
		switchModel,
		setProviderModalOpen,
	};
}
