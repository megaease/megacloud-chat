"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Custom hook to manage MCP enabled state
 * Persists the setting to localStorage and provides functions to toggle/update the state
 */
export function useMcpEnabled() {
	const [enabled, setEnabled] = useState<boolean>(false);

	// Load from localStorage on initial mount
	useEffect(() => {
		// Only run in browser environment
		if (typeof window !== "undefined") {
			const storedValue = localStorage.getItem("mcpEnabled");
			if (storedValue !== null) {
				setEnabled(storedValue === "true");
			}
		}
	}, []);

	// Update localStorage when the value changes
	const updateEnabled = (value: boolean) => {
		setEnabled(value);
		localStorage.setItem("mcpEnabled", value.toString());
		toast.success(`MCP ${value ? "enabled" : "disabled"}.`, {
			description: `MCP is now ${value ? "enabled" : "disabled"}.`,
		});
	};

	// Toggle function for convenience
	const toggleEnabled = () => {
		const newValue = !enabled;
		updateEnabled(newValue);
		return newValue;
	};

	return {
		mcpEnabled: enabled,
		setMcpEnabled: updateEnabled,
		toggleMcpEnabled: toggleEnabled,
	};
}
